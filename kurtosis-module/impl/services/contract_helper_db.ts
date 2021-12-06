import { EnclaveContext, PortSpec, PortProtocol, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext } from "kurtosis-core-api-lib";
import log from "loglevel";
import { Result, ok, err } from "neverthrow";
import { EXEC_COMMAND_SUCCESS_EXIT_CODE } from "../consts";
import { ContainerConfigSupplier } from "../near_module";

const SERVICE_ID: ServiceID = "contract-helper-db";
const PORT_ID: string = "postgres";
const IMAGE: string = "postgres:13.4-alpine3.14";
const PORT_NUM: number = 5432;
const PORT_SPEC = new PortSpec(PORT_NUM, PortProtocol.TCP);

const POSTGRES_USER: string = "near";
const POSTGRES_PASSWORD: string = "near";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "POSTGRES_USER": POSTGRES_USER,
    "POSTGRES_PASSWORD": POSTGRES_PASSWORD,
}));

const INDEXER_DB: string = "indexer";
// DBs to initialize
const DBS_TO_INITIALIZE: Set<string> = new Set([
    INDEXER_DB,
])
const MAX_AVAILABILITY_CHECK_RETRIES: number = 10;
const MILLIS_BETWEEN_AVAILABILITY_CHECK_RETRIES: number = 1000;
const AVAILABILITY_CMD: string[] = [
    "psql",
    "-U",
    POSTGRES_USER,
    "-c",
    "\\l"
];

export class ContractHelperDbInfo {
    private readonly networkInternalHostname: string;
    private readonly networkInternalPortNum: number;
    private readonly dbUsername: string;
    private readonly dbUserPassword: string;
    private readonly indexerDb: string;

    constructor(
        networkInternalHostname: string,
        networkInternalPortNum: number,
        dbUsername: string,
        dbUserPassword: string,
        indexerDb: string
    ) {
        this.networkInternalHostname = networkInternalHostname;
        this.networkInternalPortNum = networkInternalPortNum;
        this.dbUsername = dbUsername;
        this.dbUserPassword = dbUserPassword;
        this.indexerDb = indexerDb;
    }

    public getNetworkInternalHostname(): string {
        return this.networkInternalHostname;
    }

    public getNetworkInternalPortNum(): number {
        return this.networkInternalPortNum;
    }

    public getDbUsername(): string {
        return this.dbUsername;
    }

    public getDbPassword(): string {
        return this.dbUserPassword;
    }

    public getIndexerDb(): string {
        return this.indexerDb;
    }
}

export async function addContractHelperDb(enclaveCtx: EnclaveContext): Promise<Result<ContractHelperDbInfo, Error>> {

    log.info("Adding contract helper DB running on port '" + PORT_NUM + "'");
    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PORT_SPEC);
    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(IMAGE).withUsedPorts(
            usedPorts,
        ).withEnvironmentVariableOverrides(
            STATIC_ENVVARS
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const serviceCtx: ServiceContext = addServiceResult.value;

    const waitForAvailabilityResult: Result<null, Error> = await waitForContractHelperDbToBecomeAvailable(serviceCtx);
    if (waitForAvailabilityResult.isErr()) {
        return err(waitForAvailabilityResult.error);
    }

    for (const databaseToCreate of DBS_TO_INITIALIZE) {
        // Create the database inside of Postgres
        const createDbCmd: string[] = [
            "psql",
            "-U",
            POSTGRES_USER,
            "-c",
            "create database " + databaseToCreate + " with owner=" + POSTGRES_USER
        ];
        const createDatabaseResult: Result<[number, string], Error> = await serviceCtx.execCommand(createDbCmd);
        if (createDatabaseResult.isErr()) {
            return err(createDatabaseResult.error);
        }
        const [createDbExitCode, createDbLogOutput]: [number, string] = createDatabaseResult.value;
        if (createDbExitCode !== EXEC_COMMAND_SUCCESS_EXIT_CODE) {
            return err(new Error(
                `Command to create database '${createDbCmd.join(" ")}' returned error exit code '${createDbExitCode}' with logs:\n${createDbLogOutput}`
            ));
        }
    }

    const result: ContractHelperDbInfo = new ContractHelperDbInfo(
        SERVICE_ID,
        PORT_NUM,
        POSTGRES_USER,
        POSTGRES_PASSWORD,
        INDEXER_DB,
    );

    return ok(result);
}

async function waitForContractHelperDbToBecomeAvailable(serviceCtx: ServiceContext): Promise<Result<null, Error>> {
    for (let i: number = 0; i < MAX_AVAILABILITY_CHECK_RETRIES; i++) {
        const execCmdResult: Result<[number, string], Error> = await serviceCtx.execCommand(AVAILABILITY_CMD);
        if (execCmdResult.isOk()) {
            const [exitCode, logOutput] = execCmdResult.value;
            if (exitCode == EXEC_COMMAND_SUCCESS_EXIT_CODE) {
                return ok(null);
            }
            log.debug("Contract helper DB availability command '" + AVAILABILITY_CMD + "' exited with code " + exitCode.toString() + " and logs:\n" + logOutput);
        } else {
            log.debug("Contract helper DB availability command '" + AVAILABILITY_CMD + "' returned error:\n" + execCmdResult.error);
        }
        await new Promise(resolve => setTimeout(resolve, MILLIS_BETWEEN_AVAILABILITY_CHECK_RETRIES));
    }
    return err(new Error(
        "Contract helper DB didn't become available even after " + MAX_AVAILABILITY_CHECK_RETRIES + " retries with " + MILLIS_BETWEEN_AVAILABILITY_CHECK_RETRIES + "ms between retries"
    ));
}