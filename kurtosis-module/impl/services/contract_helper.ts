import { EnclaveContext, PortSpec, PortProtocol, ServiceID, ContainerConfig, ContainerConfigBuilder, ServiceContext } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { ContainerConfigSupplier } from "../near_module";
import { waitForPortAvailability } from "../service_port_availability_checker";
import { getPrivateAndPublicUrlsForPortId, ServiceUrl } from "../service_url";

const SERVICE_ID: ServiceID = "contract-helper-service"
const PORT_ID = "rest";
const PRIVATE_PORT_NUM: number = 3000;
const PUBLIC_PORT_NUM: number = 8330;
const PRIVATE_PORT_SPEC = new PortSpec(PRIVATE_PORT_NUM, PortProtocol.TCP);
const PUBLIC_PORT_SPEC = new PortSpec(PUBLIC_PORT_NUM, PortProtocol.TCP);
const PORT_PROTOCOL = "http";
const IMAGE: string = "kurtosistech/near-contract-helper:dd16f8c";

const ACCOUNT_CREATOR_KEY_ENVVAR: string = "ACCOUNT_CREATOR_KEY";
const INDEXER_DB_CONNECTION_ENVVAR: string = "INDEXER_DB_CONNECTION";
const NODE_RPC_URL_ENVVAR: string = "NODE_URL";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "MAIL_HOST": "smtp.ethereal.email",
    "MAIL_PASSWORD": "",
    "MAIL_PORT": "587",
    "MAIL_USER": "",
    "NEW_ACCOUNT_AMOUNT": "10000000000000000000000000",
    "NODE_ENV": "development", // Node.js environment; either `development` or `production`
    //I changed this value because now valid values are "testnet and mainnet"
    "NEAR_WALLET_ENV": "testnet", // Matches the value set when the Wallet image was built
    "PORT": PRIVATE_PORT_NUM.toString(), // Used internally by the contract helper; does not have to correspond to the external IP or DNS name and can link to a host machine running the Docker container
    "TWILIO_ACCOUNT_SID": "ACtest", // account SID from Twilio (used to send security code)
    "TWILIO_AUTH_TOKEN": "test", // auth token from Twilio (used to send security code)
    "TWILIO_FROM_PHONE": "+14086179592", // phone number from which to send SMS with security code (international format, starting with `+`)
    // NOTE: We can't set this because there's a circular dependency between Wallet and Contract Helper app, where
    //  they both need to point to each others' _publicly-facing ports_ (which are only available after starting the container)
    // Following the lead of https://github.com/near/local/blob/master/docker-compose.yml, we're choosing to break Contract Helper app
    "WALLET_URL": "", // NOTE: we can't set this because there's a circular dependency between
    "FUNDED_ACCOUNT_CREATOR_KEY": "{}",
    "ACCOUNT_CREATOR_KEYS":'{"private_keys":[]}',
}));
const VALIDATOR_KEY_PRETTY_PRINT_NUM_SPACES: number = 2;

const MILLIS_BETWEEN_PORT_AVAILABILITY_RETRIES: number = 500;
const PORT_AVAILABILITY_TIMEOUT_MILLIS:  number = 5_0000;

export class ContractHelperServiceInfo {
    constructor(
        public readonly privateUrl: ServiceUrl,
        public readonly publicUrl: ServiceUrl,
    ) {}
}

export async function addContractHelperService(
    enclaveCtx: EnclaveContext,
    dbPrivateUrl: ServiceUrl,
    dbUsername: string,
    dbUserPassword: string,
    dbName: string,
    nearNodePrivateRpcUrl: ServiceUrl,
    validatorKey: Object,
): Promise<Result<ContractHelperServiceInfo, Error>> {
    log.info(`Adding contract helper service running on port '${PRIVATE_PORT_NUM}'`);
    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PRIVATE_PORT_SPEC);

    const publicPorts: Map<string, PortSpec> = new Map();
    publicPorts.set(PORT_ID, PUBLIC_PORT_SPEC);

    let validatorKeyStr: string;
    try {
        validatorKeyStr = JSON.stringify(validatorKey, null, VALIDATOR_KEY_PRETTY_PRINT_NUM_SPACES);
    } catch (e: any) {
        // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
        // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
        if (e && e.stack && e.message) {
            return err(e as Error);
        }
        return err(new Error("Serializing the validator key threw an exception, but " +
            "it's not an Error so we can't report any more information than this"));
    }

    const envvars: Map<string, string> = new Map();
    envvars.set(
        ACCOUNT_CREATOR_KEY_ENVVAR,
        validatorKeyStr,
    )
    envvars.set(
        INDEXER_DB_CONNECTION_ENVVAR,
        `postgres://${dbUsername}:${dbUserPassword}@${dbPrivateUrl.ipAddress}:${dbPrivateUrl.portNumber}/${dbName}`
    )
    envvars.set(
        NODE_RPC_URL_ENVVAR,
        nearNodePrivateRpcUrl.toString(),
    )
    for (let [key, value] of STATIC_ENVVARS.entries()) {
        envvars.set(key, value);
    }

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withUsedPorts(
            usedPorts
        ).withPublicPorts(
            publicPorts,
        ).withEnvironmentVariableOverrides(
            envvars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const serviceCtx: ServiceContext = addServiceResult.value;

    const waitForPortAvailabilityResult = await waitForPortAvailability(
        PRIVATE_PORT_NUM,
        serviceCtx.getPrivateIPAddress(),
        MILLIS_BETWEEN_PORT_AVAILABILITY_RETRIES,
        PORT_AVAILABILITY_TIMEOUT_MILLIS,
    )
    if (waitForPortAvailabilityResult.isErr()) {
        return err(waitForPortAvailabilityResult.error);
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

    const result: ContractHelperServiceInfo = new ContractHelperServiceInfo(
        privateUrl,
        publicUrl,
    );

    return ok(result);
}
