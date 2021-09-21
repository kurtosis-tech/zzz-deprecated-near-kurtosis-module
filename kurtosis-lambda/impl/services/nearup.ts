import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";
import { ContainerRunConfigSupplier, } from "../near_lambda";

const NEARUP_SERVICE_ID: ServiceID = "nearup";
const NEARUP_IMAGE: string = "nearprotocol/nearup";
const NEARUP_PORT_NUM: number = 3030;
const NEARUP_DOCKER_PORT_DESC: string = NEARUP_PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
const CREATED_VALIDATOR_KEY_FILEPATH: string = "/root/.near/localnet/node0/validator_key.json";

export class NearupInfo {
    private readonly networkInternalHostname: string;
    private readonly networkInternalPortNum: number;
    // Will only be set if debug mode is enabled
    private readonly maybeHostMachinePortBinding: PortBinding | undefined;
    private readonly validatorKey: string;

    constructor(
        networkInternalHostname: string,
        networkInternalPortNum: number,
        maybeHostMachinePortBinding: PortBinding | undefined,
        validatorKey: string,
    ) {
        this.networkInternalHostname = networkInternalHostname;
        this.networkInternalPortNum = networkInternalPortNum;
        this.maybeHostMachinePortBinding = maybeHostMachinePortBinding;
        this.validatorKey = validatorKey;
    }

    public getNetworkInternalHostname(): string {
        return this.networkInternalHostname;
    }

    public getNetworkInternalPortNum(): number {
        return this.networkInternalPortNum;
    }

    public getMaybeHostMachinePortBinding(): PortBinding | undefined {
        return this.maybeHostMachinePortBinding;
    }

    public getValidatorKey(): string {
        return this.validatorKey;
    }
}

// Return type is (serviceCtx, hostPortBindings, statusUrl | null, validatorKey)
export async function addNearupService(networkCtx: NetworkContext): Promise<Result<NearupInfo, Error>> {
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(NEARUP_DOCKER_PORT_DESC)
    const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
        NEARUP_IMAGE,
    ).withUsedPorts(
        usedPortsSet
    ).build();

    const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
        const result: ContainerRunConfig = new ContainerRunConfigBuilder().withCmdOverride(
            [
                "run", 
                "localnet"
            ]
        ).build();
        return ok(result);
    }

    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(NEARUP_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const [serviceCtx, hostPortBindings]: [ServiceContext, Map<string, PortBinding>] = addServiceResult.value;
    const maybeHostMachinePortBinding: PortBinding | undefined = hostPortBindings.get(NEARUP_DOCKER_PORT_DESC);

    const getValidatorKeyCmd: string[] = [
        "cat",
        CREATED_VALIDATOR_KEY_FILEPATH
    ]
    const getValidatorKeyResult: Result<[number, string], Error> = await serviceCtx.execCommand(getValidatorKeyCmd);
    if (getValidatorKeyResult.isErr()) {
        return err(getValidatorKeyResult.error);
    }
    const [getValidatorKeyExitCode, getValidatorKeyLogOutput]: [number, string] = getValidatorKeyResult.value;
    if (getValidatorKeyExitCode !== EXEC_COMMAND_SUCCESS_EXIT_CODE) {
        return err(new Error("Command to get validator key from file '" + CREATED_VALIDATOR_KEY_FILEPATH + "' failed with error code '" + getValidatorKeyExitCode + "' and log output: " + getValidatorKeyLogOutput));
    }
    const validatorKey: string = getValidatorKeyLogOutput;

    const result: NearupInfo = new NearupInfo(
        NEARUP_SERVICE_ID,
        NEARUP_PORT_NUM,
        maybeHostMachinePortBinding,
        validatorKey
    );

    return ok(result);
}