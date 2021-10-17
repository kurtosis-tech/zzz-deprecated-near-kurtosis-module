/*
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
const GET_VALIDATOR_KEY_CMD: string[] = [
    "cat",
    CREATED_VALIDATOR_KEY_FILEPATH
]
const GET_VALIDATOR_KEY_MAX_RETRIES: number = 60;  // In local testing, it takes ~30s to generate the validator key
const GET_VALIDATOR_KEY_MILLIS_BETWEEN_RETRIES: number = 1000;

export class NearupInfo {
    private readonly networkInternalHostname: string;
    private readonly networkInternalPortNum: number;
    // Will only be set if debug mode is enabled
    private readonly maybeHostMachineUrl: string | undefined;
    private readonly validatorKey: string;

    constructor(
        networkInternalHostname: string,
        networkInternalPortNum: number,
        maybeHostMachineUrl: string | undefined,
        validatorKey: string,
    ) {
        this.networkInternalHostname = networkInternalHostname;
        this.networkInternalPortNum = networkInternalPortNum;
        this.maybeHostMachineUrl = maybeHostMachineUrl;
        this.validatorKey = validatorKey;
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

    const getValidatorKeyResult: Result<string, Error> = await getValidatorKey(serviceCtx);
    if (getValidatorKeyResult.isErr()) {
        return err(getValidatorKeyResult.error);
    }
    const validatorKey: string = getValidatorKeyResult.value;

    const maybeHostMachinePortBinding: PortBinding | undefined = hostPortBindings.get(NEARUP_DOCKER_PORT_DESC);
    const formHostMachineUrlResult: Result<string | undefined, Error> = tryToFormHostMachineUrl(
        maybeHostMachinePortBinding,
        (ipAddr: string, portNum: number) => `http://${ipAddr}:${portNum}`
    )
    if (formHostMachineUrlResult.isErr()) {
        return err(formHostMachineUrlResult.error);
    }
    const maybeHostMachineUrl: string | undefined = formHostMachineUrlResult.value;

    const result: NearupInfo = new NearupInfo(
        NEARUP_SERVICE_ID,
        NEARUP_PORT_NUM,
        maybeHostMachineUrl,
        validatorKey
    );

    return ok(result);
}

// The validator key will only be created when the localnet is up, so we'll need to retry a few times
async function getValidatorKey(serviceCtx: ServiceContext): Promise<Result<string, Error>> {
    for (let i: number = 0; i < GET_VALIDATOR_KEY_MAX_RETRIES; i++) {
        const execCmdResult: Result<[number, string], Error> = await serviceCtx.execCommand(GET_VALIDATOR_KEY_CMD);
        if (execCmdResult.isOk()) {
            const [exitCode, logOutput] = execCmdResult.value;
            if (exitCode == EXEC_COMMAND_SUCCESS_EXIT_CODE) {
                return ok(logOutput);
            }
            log.debug(`Get validator key command '${GET_VALIDATOR_KEY_CMD}' exited with code '${exitCode}'' and logs:\n${logOutput}`);
        } else {
            log.debug(`Get validator key command '${GET_VALIDATOR_KEY_CMD}' returned error:\n${execCmdResult.error}`);
        }
        await new Promise(resolve => setTimeout(resolve, GET_VALIDATOR_KEY_MILLIS_BETWEEN_RETRIES));
    }
    return err(new Error(
        `Couldn't get validator key even after ${GET_VALIDATOR_KEY_MAX_RETRIES} retries with ${GET_VALIDATOR_KEY_MILLIS_BETWEEN_RETRIES}ms between retries`
    ));
}
*/