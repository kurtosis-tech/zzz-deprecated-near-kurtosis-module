import { EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortSpec, PortProtocol } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { ContainerConfigSupplier } from "../near_module";
import { getPrivateAndPublicUrlsForPortId, ServiceUrl } from "../service_url";

const SERVICE_ID: ServiceID = "wallet";
const PORT_NUM: number = 3004;
const IMAGE: string = "kurtosistech/near-wallet:17684565";
const PORT_ID = "http";
const PORT_PROTOCOL = "http";
const PORT_SPEC = new PortSpec(PORT_NUM, PortProtocol.TCP);

// These variable names come from https://github.com/near/near-wallet/blob/master/packages/frontend/src/config.js
const CONTRACT_HELPER_JS_VAR: string = "ACCOUNT_HELPER_URL";
const EXPLORER_URL_JS_VAR: string = "EXPLORER_URL";
const NODE_URL_JS_VAR: string = "NODE_URL";
const STATIC_JS_VARS: Map<string, string> = new Map(Object.entries({
    "IS_MAINNET": "false",
    "NETWORK_ID": "localnet",
    // TODO make this dynamic, from the validator key that comes back from indexer node startup
    "ACCOUNT_ID_SUFFIX": "test.near",
    "ACCESS_KEY_FUNDING_AMOUNT": "3000000000000000000000000", // TODO is this right???
}))

// The glob that identifies the Parcel-bundled JS file containing the Wallet code, which we'll
//  modify to insert the environment variables we want
const WALLET_JS_FILE_GLOB = "/var/www/html/wallet/src*js";

// From the Wallet Dockerfile
// We override this so that we can insert our desired envvars into the Wallet's source Javascript file
const ORIGINAL_WALLET_ENTRYPOINT_COMMAND = "/sbin/my_init --";

// sed delimiter that we'll use when sed-ing the Wallet JS file, and which the JS variables cannot contain
const JS_REPLACEMENT_SED_DELIMITER = "$"

// Checks if the Wallet container is available by determining if the NginX server is running, which only
// happens after we build the Wallet to pick up the envvars (see the Wallet Dockerfile for more info) 
const AVAILABILITY_CHECK_CMD: string[] = [
    "bash",
    "-c",
    "ps aux | grep my_init | grep -v 'grep' | grep -v 'npm'",
]

const MAX_AVAILABILITY_CHECKS: number = 30;
const MILLIS_BETWEEN_AVAILABILITY_CHECKS: number = 1000;

export class WalletInfo {
    constructor(
        public readonly publicUrl: ServiceUrl,
    ) {}
}

export async function addWallet(
    enclaveCtx: EnclaveContext,
    nearNodePublicRpcUrl: ServiceUrl,
    contractHelperPublicUrl: ServiceUrl,
    explorerPublicUrl: ServiceUrl,
): Promise<Result<WalletInfo, Error>> {
    log.info(`Adding wallet running on port '${PORT_NUM}'`);
    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PORT_SPEC);

    // Javascript variables that will be slotted into the Wallet's source JS code
    const jsVars: Map<string, string> = new Map(Object.entries({
        NODE_URL_JS_VAR: nearNodePublicRpcUrl.toString(),
        CONTRACT_HELPER_JS_VAR: contractHelperPublicUrl.toString(),
        EXPLORER_URL_JS_VAR: explorerPublicUrl.toString(),
    }));
    for (let [key, value] of STATIC_JS_VARS.entries()) {
        jsVars.set(key, value);
    }

    const generateJsUpdatingCommandResult = generateJsSrcUpdatingCommands(jsVars);
    if (generateJsUpdatingCommandResult.isErr()) {
        return err(generateJsUpdatingCommandResult.error);
    }
    const commandsToRun = generateJsUpdatingCommandResult.value;
    commandsToRun.push(ORIGINAL_WALLET_ENTRYPOINT_COMMAND)
    const singleCmdStringToRun = commandsToRun.join(" && ");

    log.debug(`Wallet Parcel JS-updating command to run: ${singleCmdStringToRun}`)

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string, sharedDirectory: SharedPath) => {
        const result = new ContainerConfigBuilder(
            IMAGE,
        ).withUsedPorts(
            usedPorts
        ).withEntrypointOverride([
            // If we don't override the entrypoint, it gets set to starting the NginX server that serves the Wallet assets
            "sh", 
            "-c",
        ]).withCmdOverride([
            singleCmdStringToRun,
        ]).build();
        return ok(result);
    }
    
    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const serviceCtx = addServiceResult.value;

    const waitForAvailabilityResult = await waitUntilAvailable(serviceCtx)
    if (waitForAvailabilityResult.isErr()) {
        return err(waitForAvailabilityResult.error);
    }


    const getUrlsResult = getPrivateAndPublicUrlsForPortId(
        serviceCtx,
        PORT_ID,
        PORT_PROTOCOL,
        "",
    );
    if (getUrlsResult.isErr()) {
        return err(getUrlsResult.error);
    }
    const [privateUrl, publicUrl] = getUrlsResult.value;

    const result: WalletInfo = new WalletInfo(publicUrl)

    return ok(result);
}

async function waitUntilAvailable(serviceCtx: ServiceContext): Promise<Result<null, Error>> {
    for (let i: number = 0; i < MAX_AVAILABILITY_CHECKS; i++) {
        const execCmdResult = await serviceCtx.execCommand(AVAILABILITY_CHECK_CMD)
        if (execCmdResult.isOk()) {
            const logOutput = execCmdResult.value[1];
            // If there's log output, it means there's a running NginX process
            if (logOutput.length > 0) {
                return ok(null);
            }
        }
        await new Promise(resolve => {
            setTimeout(resolve, MILLIS_BETWEEN_AVAILABILITY_CHECKS);
        });
    }
    return err(new Error(
        `The Wallet container didn't become available even after ${MAX_AVAILABILITY_CHECKS} checks with ${MILLIS_BETWEEN_AVAILABILITY_CHECKS}ms between checks`
    ));
}

// The NEAR Wallet is bundled using Parcel down into assets that get served statically via NginX
// Parcel-bundled apps only read environment variables at *build* time, so the only way to
//  modify the Wallet's behaviour would be to set environemnt variables and rebuild the Wallet inside Docker
// Unfortunately, building the Wallet in the Docker image is both slow (2+ minutes) and resource-intensive
// To get around this, we generate a giant command to 'sed' the Parcel-bundled JS to set the variables we need
// See also: https://github.com/near/near-wallet/issues/80
function generateJsSrcUpdatingCommands(jsVars: Map<string, string>): Result<string[], Error> {
    const verifyEnvvarExitenceFuncName = "verify_envvar_existence"
    const declareEnvvarExistenceFuncStr = `${verifyEnvvarExitenceFuncName} () { if ! grep "\${1}" ${WALLET_JS_FILE_GLOB}; then echo "Wallet source JS file is missing expected environment variable '\${1}'"; return 1; fi; }`

    const commandFragments: string[] = [ declareEnvvarExistenceFuncStr ]
    for (let [key, value] of jsVars.entries()) {
        if (key.includes(JS_REPLACEMENT_SED_DELIMITER)) {
            return err(new Error(`Cannot insert new value for variable '${key}' in the Wallet JS file; its name includes our sed delimiter character '${JS_REPLACEMENT_SED_DELIMITER}`))
        }
        if (value.includes(JS_REPLACEMENT_SED_DELIMITER)) {
            return err(new Error(`Cannot insert value '${value}' for variable '${key}' in the Wallet JS file because the value includes our sed delimiter character '${JS_REPLACEMENT_SED_DELIMITER}`))
        }
        const verifyEnvvarExistenceCommand = `${verifyEnvvarExitenceFuncName} "${key}"`;
        commandFragments.push(verifyEnvvarExistenceCommand);

        // Parcel envvars get set as a bunch of properties, like:
        // ....MOONPAY_API_URL:"SOMETHING",ACCOUNT_ID_SUFFIX:"SOMETHING ELSE"....
        // We therefore look for the property assignments and overwrite the value with our constant string instead
        const updateJsFileCommand = `sed -i -E 's${JS_REPLACEMENT_SED_DELIMITER}([,{])${key}:"[^"]*"([,}])${JS_REPLACEMENT_SED_DELIMITER}\\1${key}:"${value}"\\2${JS_REPLACEMENT_SED_DELIMITER}g' ${WALLET_JS_FILE_GLOB}`
        commandFragments.push(updateJsFileCommand);
    }

    return ok(commandFragments);
}