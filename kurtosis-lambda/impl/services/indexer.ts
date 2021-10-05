import { NetworkContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";

const SERVICE_ID: ServiceID = "indexer"
const IMAGE: string = "kurtosistech/near-indexer-for-explorer";
const PORT_NUM: number = 3030;
const DOCKER_PORT_DESC: string = PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
const DATABASE_URL_ENVVAR = "DATABASE_URL";

const VALIDATOR_KEY_FILEPATH: string = "/root/.near/localnet/validator_key.json";
const GET_VALIDATOR_KEY_CMD: string[] = [
    "cat",
    VALIDATOR_KEY_FILEPATH
]

export class IndexerInfo {
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

export async function addIndexer(
    networkCtx: NetworkContext,
    dbHostname: string,
    dbPortNum: number,
    dbUsername: string,
    dbUserPassword: string,
    dbName: string,
): Promise<Result<IndexerInfo, Error>> {
    log.info(`Adding indexer service...`);
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(DOCKER_PORT_DESC)

    const envvars: Map<string, string> = new Map();
    envvars.set(
        DATABASE_URL_ENVVAR,
        `postgres://${dbUsername}:${dbUserPassword}@${dbHostname}:${dbPortNum}/${dbName}`
    )

    const containerConfigSupplier: (ipAddr: string, sharedDirpath: SharedPath) => Result<ContainerConfig, Error> = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
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
    const validatorKey: string = getValidatorKeyLogOutput;

    const maybeHostMachinePortBinding: PortBinding | undefined = hostMachinePortBindings.get(DOCKER_PORT_DESC);
    const formHostMachineUrlResult: Result<string | undefined, Error> = tryToFormHostMachineUrl(
        maybeHostMachinePortBinding,
        (ipAddr: string, portNum: number) => `http://${ipAddr}:${portNum}`
    )
    if (formHostMachineUrlResult.isErr()) {
        return err(formHostMachineUrlResult.error);
    }
    const maybeHostMachineUrl: string | undefined = formHostMachineUrlResult.value;

    const result: IndexerInfo = new IndexerInfo(
        SERVICE_ID,
        PORT_NUM,
        maybeHostMachineUrl,
        validatorKey,
    );

    return ok(result);
}