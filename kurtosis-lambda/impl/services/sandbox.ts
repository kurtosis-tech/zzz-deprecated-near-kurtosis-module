import { NetworkContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log from "loglevel";
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, NearKey, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";
import { ContainerConfigSupplier } from "../near_lambda";

const SERVICE_ID: ServiceID = "sandbox-node";
const IMAGE: string = "kurtosistech/nearcore-sandbox:latest";
const PORT_NUM: number = 3030;
const DOCKER_PORT_DESC: string = PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;

const NEAR_HOME: string = "/root/.near"
const VALIDATOR_KEY_FILEPATH: string = NEAR_HOME + "/validator_key.json";
const NODE_KEY_FILEPATH: string = NEAR_HOME + "/node_key.json";
const GET_VALIDATOR_KEY_CMD: string[] = [
    "cat",
    VALIDATOR_KEY_FILEPATH,
]
const GET_NODE_KEY_CMD: string[] = [
    "cat",
    NODE_KEY_FILEPATH,
]

const CMD: string[] = [
    "bash",
    "-c",
    "neard init --chain-id localnet && neard run"
]

export class NearNodeInfo {
    private readonly networkInternalHostname: string;
    private readonly networkInternalPortNum: number;
    // Will only be set if debug mode is enabled
    private readonly maybeHostMachineUrl: string | undefined;
    private readonly validatorKey: NearKey;
    private readonly nodeKey: NearKey;

    constructor(
        networkInternalHostname: string,
        networkInternalPortNum: number,
        maybeHostMachineUrl: string | undefined,
        validatorKey: NearKey,
        nodeKey: NearKey,
    ) {
        this.networkInternalHostname = networkInternalHostname;
        this.networkInternalPortNum = networkInternalPortNum;
        this.maybeHostMachineUrl = maybeHostMachineUrl;
        this.validatorKey = validatorKey;
        this.nodeKey = nodeKey;
    }

    public getNetworkInternalHostname(): string {
        return this.networkInternalHostname;
    }

    public getNetworkInternalPortNum(): number {
        return this.networkInternalPortNum;
    }

    public getMaybeHostMachineUrl(): string | undefined {
        return this.maybeHostMachineUrl;
    }

    public getValidatorKey(): NearKey {
        return this.validatorKey;
    }

    public getNodeKey(): NearKey {
        return this.nodeKey;
    }
}

export async function addSandboxNode(
    networkCtx: NetworkContext,
): Promise<Result<NearNodeInfo, Error>> {
    log.info(`Adding sandbox node service...`);
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(DOCKER_PORT_DESC)

    // const envvars: Map<string, string> = new Map(STATIC_ENVVARS)

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withUsedPorts(
            usedPortsSet
        ).withCmdOverride(
            CMD,
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const [serviceCtx, hostMachinePortBindings]: [ServiceContext, Map<string, PortBinding>] = addServiceResult.value;

    const getValidatorKeyResult: Result<[number, string], Error> = await serviceCtx.execCommand(GET_VALIDATOR_KEY_CMD);
    if (getValidatorKeyResult.isErr()) {
        return err(getValidatorKeyResult.error);
    }
    const [getValidatorKeyExitCode, getValidatorKeyLogOutput] = getValidatorKeyResult.value;
    if (getValidatorKeyExitCode !== EXEC_COMMAND_SUCCESS_EXIT_CODE) {
        return err(new Error(
            `Get validator key command '${GET_VALIDATOR_KEY_CMD}' exited with code '${getValidatorKeyExitCode}'' and logs:\n${getValidatorKeyLogOutput}`
        ));
    }
    let validatorKey: NearKey;
    try {
        validatorKey = JSON.parse(getValidatorKeyLogOutput)
    } catch (e: any) {
        // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
        // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
        if (e && e.stack && e.message) {
            return err(e as Error);
        }
        return err(new Error(
            `Parsing validator key string '${getValidatorKeyLogOutput}' threw an exception, but " +
                "it's not an Error so we can't report any more information than this`
        ));
    }

    const getNodeKeyResult: Result<[number, string], Error> = await serviceCtx.execCommand(GET_NODE_KEY_CMD);
    if (getNodeKeyResult.isErr()) {
        return err(getNodeKeyResult.error);
    }
    const [getNodeKeyExitCode, getNodeKeyLogOutput] = getNodeKeyResult.value;
    if (getNodeKeyExitCode !== EXEC_COMMAND_SUCCESS_EXIT_CODE) {
        return err(new Error(
            `Get validator key command '${GET_VALIDATOR_KEY_CMD}' exited with code '${getNodeKeyExitCode}'' and logs:\n${getNodeKeyLogOutput}`
        ));
    }
    let nodeKey: NearKey;
    try {
        nodeKey = JSON.parse(getNodeKeyLogOutput)
    } catch (e: any) {
        // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
        // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
        if (e && e.stack && e.message) {
            return err(e as Error);
        }
        return err(new Error(
            `Parsing node key string '${getNodeKeyLogOutput}' threw an exception, but " +
                "it's not an Error so we can't report any more information than this`
        ));
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

    const result: NearNodeInfo = new NearNodeInfo(
        SERVICE_ID,
        PORT_NUM,
        maybeHostMachineUrl,
        validatorKey,
        nodeKey,
    );

    return ok(result);
}