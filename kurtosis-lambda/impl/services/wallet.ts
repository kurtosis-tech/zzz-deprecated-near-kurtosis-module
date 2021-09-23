import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";
import { ContainerRunConfigSupplier, } from "../near_lambda";

const SERVICE_ID: ServiceID = "wallet";
const PORT_NUM: number = 3004;
const DOCKER_PORT_DESC: string = PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
// TODO REPLACE WITH SOMETHING FROM DOCKERHUB
const IMAGE: string = "near-wallet";

const ENV_FILE_FILEPATH: string = ""

const CONTRACT_HELPER_URL_ENVVAR: string = "REACT_APP_ACCOUNT_HELPER_URL";
const EXPLORER_URL_ENVVAR: string = "EXPLORER_URL";
const NODE_URL_ENVVAR: string = "REACT_APP_NODE_URL";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "REACT_APP_IS_MAINNET": "false",
    "REACT_APP_NETWORK_ID": "localnet",
    "REACT_APP_ACCOUNT_ID_SUFFIX": "TODO",
    "REACT_APP_ACCESS_KEY_FUNDING_AMOUNT": "3000000000000000000000000", // TODO is this right???
}))

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
    const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
        IMAGE,
    ).withUsedPorts(
        usedPortsSet
    ).build();

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
    const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
        const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
            envvars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const [serviceCtx, hostMachinePortBindings]: [ServiceContext, Map<string, PortBinding>] = addServiceResult.value;

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