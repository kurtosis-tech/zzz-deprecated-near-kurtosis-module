import { NetworkContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";
import { ContainerConfigSupplier } from "../near_module";

const SERVICE_ID: ServiceID = "wallet";
const PORT_NUM: number = 3004;
const DOCKER_PORT_DESC: string = PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
const IMAGE: string = "kurtosistech/near-wallet";

const CONTRACT_HELPER_URL_ENVVAR: string = "REACT_APP_ACCOUNT_HELPER_URL";
const EXPLORER_URL_ENVVAR: string = "EXPLORER_URL";
const NODE_URL_ENVVAR: string = "REACT_APP_NODE_URL";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "REACT_APP_IS_MAINNET": "false",
    "REACT_APP_NETWORK_ID": "localnet",
    "REACT_APP_ACCOUNT_ID_SUFFIX": "TODO",
    "REACT_APP_ACCESS_KEY_FUNDING_AMOUNT": "3000000000000000000000000", // TODO is this right???
}))

// Checks if the Wallet container is available by determining if the NginX server is running, which only
// happens after we build the Wallet to pick up the envvars (see the Wallet Dockerfile for more info) 
const AVAILABILITY_CHECK_CMD: string[] = [
    "bash",
    "-c",
    "ps aux | grep my_init | grep -v 'grep' | grep -v 'npm'",
]

// The wallet takes about a minute to build, so we give it 2min to become available
const MAX_AVAILABILITY_CHECKS: number = 60;
const MILLIS_BETWEEN_AVAILABILITY_CHECKS: number = 2000;

export class WalletInfo {
    // Will be set to undefined only in debug mode
    private readonly maybeHostMachineUrl: string | undefined;

    constructor(maybeHostMachineUrl: string | undefined) {
        this.maybeHostMachineUrl = maybeHostMachineUrl;
    }

    public getMaybeHostMachineUrl(): string | undefined {
        return this.maybeHostMachineUrl;
    }
}

export async function addWallet(
    networkCtx: NetworkContext,
    maybeHostMachineNearNodeRpcUrl: string | undefined,
    maybeHostMachineContractHelperUrl: string | undefined,
    maybeHostMachineExplorerUrl: string | undefined,
): Promise<Result<WalletInfo, Error>> {
    log.info(`Adding wallet running on port '${DOCKER_PORT_DESC}'`);
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(DOCKER_PORT_DESC)

    const envvars: Map<string, string> = new Map();
    if (maybeHostMachineNearNodeRpcUrl !== undefined) {
        envvars.set(
            NODE_URL_ENVVAR,
            maybeHostMachineNearNodeRpcUrl
        );
    }
    if (maybeHostMachineContractHelperUrl !== undefined) {
        envvars.set(
            CONTRACT_HELPER_URL_ENVVAR,
            maybeHostMachineContractHelperUrl
        );
    }
    if (maybeHostMachineExplorerUrl !== undefined) {
        envvars.set(
            EXPLORER_URL_ENVVAR,
            maybeHostMachineExplorerUrl
        )
    }
    for (let [key, value] of STATIC_ENVVARS.entries()) {
        envvars.set(key, value);
    }

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string, sharedDirectory: SharedPath) => {
        const result = new ContainerConfigBuilder(
            IMAGE,
        ).withUsedPorts(
            usedPortsSet
        ).withEnvironmentVariableOverrides(
                envvars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const [serviceCtx, hostMachinePortBindings]: [ServiceContext, Map<string, PortBinding>] = addServiceResult.value;

    const waitForAvailabilityResult = await waitUntilAvailable(serviceCtx)
    if (waitForAvailabilityResult.isErr()) {
        return err(waitForAvailabilityResult.error);
    }

    const maybeHostMachinePortBinding: PortBinding | undefined = hostMachinePortBindings.get(DOCKER_PORT_DESC);
    const formHostMachineUrlResult: Result<string | undefined, Error> = tryToFormHostMachineUrl(
        maybeHostMachinePortBinding,
        (ipAddr: string, portNum: number) => `http://${ipAddr}:${portNum}`
    ) 
    if (formHostMachineUrlResult.isErr()) {
        return err(formHostMachineUrlResult.error);
    }
    const maybeHostMachineUrl: string | undefined = formHostMachineUrlResult.value;

    const result: WalletInfo = new WalletInfo(maybeHostMachineUrl)

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