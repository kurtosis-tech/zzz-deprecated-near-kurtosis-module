import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL } from "../consts";
import { ContainerRunConfigSupplier, } from "../near_lambda";

const SERVICE_ID: string = "contract-helper-db";
const IMAGE: string = "postgres:13.4-alpine3.14";
const PORT_NUM: number = 5432;
const DOCKER_PORT_DESC: string = PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
const POSTGRES_USER: string = "helper";
const POSTGRES_PASSWORD: string = "helper";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "POSTGRES_USER": POSTGRES_USER,
    "POSTGRES_PASSWORD": POSTGRES_PASSWORD,
}));
const ACCOUNTS_DEVELOPMENT_DB: string = "accounts_development";
const MAX_AVAILABILITY_CHECK_RETRIES: number = 10;
const MILLIS_BETWEEN_AVAILABILITY_CHECK_RETRIES: number = 1000;
const AVAILABILITY_CMD: string[] = [
    "psql",
    "-U",
    POSTGRES_USER,
    "-c",
    "\\l"
];

const DB_INITIALIZATION_SQL_FILE_ID: StaticFileID = "contract-helper-initialization-sql"
const DB_INITIALIZATION_SQL_FILEPATH_ON_LAMBDA_CONTAINER: string = "/static-files/contract-helper-db.sql";

export class ContractHelperDbInfo {
    private readonly networkInternalHostname: string;
    private readonly networkInternalPortNum: number;
    private readonly dbUsername: string;
    private readonly dbUserPassword: string;

    constructor(
        networkInternalHostname: string,
        networkInternalPortNum: number,
        dbUsername: string,
        dbUserPassword: string,
    ) {
        this.networkInternalHostname = networkInternalHostname;
        this.networkInternalPortNum = networkInternalPortNum;
        this.dbUsername = dbUsername;
        this.dbUserPassword = dbUserPassword;
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
}

export async function addContractHelperDb(networkCtx: NetworkContext): Promise<Result<ContractHelperDbInfo, Error>> {
    const staticFileFilepathsOnThisContainer: Map<StaticFileID, string> = new Map();
    // TODO Make working with static files wayyyyyy better!!!!
    staticFileFilepathsOnThisContainer.set(DB_INITIALIZATION_SQL_FILE_ID, DB_INITIALIZATION_SQL_FILEPATH_ON_LAMBDA_CONTAINER);
    const registerStaticFilesResult: Result<null, Error> = await networkCtx.registerStaticFiles(staticFileFilepathsOnThisContainer)
    if (registerStaticFilesResult.isErr()) {
        return err(registerStaticFilesResult.error);
    }

    log.info("Adding contract helper DB running on port '" + DOCKER_PORT_DESC + "'");
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(DOCKER_PORT_DESC)
    const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
        IMAGE,
    ).withUsedPorts(
        usedPortsSet
    ).withStaticFiles(
        new Set(staticFileFilepathsOnThisContainer.keys())
    ).build();

    const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
        const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
            STATIC_ENVVARS
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const [serviceCtx, hostPortBindings]: [ServiceContext, Map<string, PortBinding>] = addServiceResult.value;

    const waitForAvailabilityResult: Result<null, Error> = await waitForContractHelperDbToBecomeAvailable(serviceCtx);
    if (waitForAvailabilityResult.isErr()) {
        return err(waitForAvailabilityResult.error);
    }

    const createDbCmd: string[] = [
        "psql",
        "-U",
        POSTGRES_USER,
        "-c",
        "create database " + ACCOUNTS_DEVELOPMENT_DB + " with owner=" + POSTGRES_USER
    ];
    const createDatabaseResult: Result<[number, string], Error> = await serviceCtx.execCommand(createDbCmd);
    if (createDatabaseResult.isErr()) {
        return err(createDatabaseResult.error);
    }
    const [createDbExitCode, createDbLogOutput]: [number, string] = createDatabaseResult.value;
    if (createDbExitCode !== EXEC_COMMAND_SUCCESS_EXIT_CODE) {
        return err(new Error("Command to create database '" + createDbCmd.join(" ") + "' returned error exit code '" + createDbExitCode + "' with logs: " + createDbLogOutput));
    }

    const loadStaticFilesResult: Result<Map<StaticFileID, string>, Error> = await serviceCtx.loadStaticFiles(new Set(staticFileFilepathsOnThisContainer.keys()))
    if (loadStaticFilesResult.isErr()) {
        return err(loadStaticFilesResult.error);
    }
    const staticFileFilepathsOnSvc: Map<StaticFileID, string> = loadStaticFilesResult.value;

    const maybeInitializationSqlFilepathOnSvc: string | undefined = staticFileFilepathsOnSvc.get(DB_INITIALIZATION_SQL_FILE_ID);
    if (maybeInitializationSqlFilepathOnSvc === undefined) {
        return err(new Error("Couldn't find a filepath on the service for the DB initialization SQL file; this is VERY weird!"));
    }
    const initializationSqlFilepathOnSvc: string = maybeInitializationSqlFilepathOnSvc;

    const initializeDbCmd: string[] = [
        "sh",
        "-c",
        "cat " + initializationSqlFilepathOnSvc + " | psql -U " + POSTGRES_USER + " -d " + ACCOUNTS_DEVELOPMENT_DB
    ];
    const initializeDbResult: Result<[number, string], Error> = await serviceCtx.execCommand(initializeDbCmd);
    if (initializeDbResult.isErr()) {
        return err(initializeDbResult.error);
    }
    const [initializeDbExitCode, initializeDbLogOutput]: [number, string] = initializeDbResult.value;
    if (initializeDbExitCode !== EXEC_COMMAND_SUCCESS_EXIT_CODE) {
        return err(new Error("Command to initialize database '" + initializeDbCmd.join(" ") + "' returned error exit code '" + initializeDbExitCode + "' with logs: " + initializeDbLogOutput));
    }

    const result: ContractHelperDbInfo = new ContractHelperDbInfo(
        SERVICE_ID,
        PORT_NUM,
        POSTGRES_USER,
        POSTGRES_PASSWORD,
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