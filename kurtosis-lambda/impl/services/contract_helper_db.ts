import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL } from "../consts";
import { ContainerRunConfigSupplier, } from "../near_lambda";

const CONTRACT_HELPER_DB_SERVICE_ID: string = "contract-helper-db";
const CONTRACT_HELPER_DB_IMAGE: string = "postgres:13.4-alpine3.14";
const CONTRACT_HELPER_DB_PORT_NUM: number = 5432;
const CONTRACT_HELPER_DB_DOCKER_PORT_DESC: string = CONTRACT_HELPER_DB_PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
const CONTRACT_HELPER_DB_POSTGRES_USER: string = "helper";
const CONTRACT_HELPER_DB_POSTGRES_PASSWORD: string = "helper";
const CONTRACT_HELPER_DB_STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "POSTGRES_USER": CONTRACT_HELPER_DB_POSTGRES_USER,
    "POSTGRES_PASSWORD": CONTRACT_HELPER_DB_POSTGRES_PASSWORD,
}));
const CONTRACT_HELPER_DB_ACCOUNTS_DEVELOPMENT_DB: string = "accounts_development";
const CONTRACT_HELPER_DB_MAX_AVAILABILITY_CHECK_RETRIES: number = 10;
const CONTRACT_HELPER_DB_MILLIS_BETWEEN_AVAILABILITY_CHECK_RETRIES: number = 1;
const CONTRACT_HELPER_DB_AVAILABILITY_CMD: string[] = [
    "pg_isready",
    "-U",
    CONTRACT_HELPER_DB_POSTGRES_USER
];

export async function addContractHelperDb(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
    log.info("Adding contract helper DB running on port '" + CONTRACT_HELPER_DB_DOCKER_PORT_DESC + "'");
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(CONTRACT_HELPER_DB_DOCKER_PORT_DESC)
    const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
        CONTRACT_HELPER_DB_IMAGE,
    ).withUsedPorts(
        usedPortsSet
    ).build();

    const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
        const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
            CONTRACT_HELPER_DB_STATIC_ENVVARS
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(CONTRACT_HELPER_DB_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const serviceCtx: ServiceContext = addServiceResult.value[0];

    const waitForAvailabilityResult: Result<null, Error> = await waitForContractHelperDbToBecomeAvailable(serviceCtx);
    if (waitForAvailabilityResult.isErr()) {
        return err(waitForAvailabilityResult.error);
    }

    const createDbCmd: string[] = [
        "psql",
        "-U",
        CONTRACT_HELPER_DB_POSTGRES_USER,
        "-c",
        "create database " + CONTRACT_HELPER_DB_ACCOUNTS_DEVELOPMENT_DB + " with owner=" + CONTRACT_HELPER_DB_POSTGRES_USER
    ];
    const createDatabaseResult: Result<[number, Uint8Array | string], Error> = await serviceCtx.execCommand(createDbCmd);
    if (createDatabaseResult.isErr()) {
        return err(createDatabaseResult.error);
    }
    const [exitCode, logOutput]: [number, Uint8Array | string] = createDatabaseResult.value;
    if (exitCode != 0) {
        return err(new Error("Command to create database '" + CONTRACT_HELPER_DB_ACCOUNTS_DEVELOPMENT_DB + "' returned nonzero exit code '" + exitCode + "' with logs: " + logOutput));
    }

    return ok(addServiceResult.value);
}

async function waitForContractHelperDbToBecomeAvailable(serviceCtx: ServiceContext): Promise<Result<null, Error>> {
    for (let i: number = 0; i < CONTRACT_HELPER_DB_MAX_AVAILABILITY_CHECK_RETRIES; i++) {
        const execCmdResult: Result<[number, Uint8Array | string], Error> = await serviceCtx.execCommand(CONTRACT_HELPER_DB_AVAILABILITY_CMD);
        if (execCmdResult.isOk() && execCmdResult.value[0] == EXEC_COMMAND_SUCCESS_EXIT_CODE) {
            return ok(null);
        }
        await new Promise(resolve => setTimeout(resolve, CONTRACT_HELPER_DB_MILLIS_BETWEEN_AVAILABILITY_CHECK_RETRIES));
    }
    return err(new Error(
        "Contract helper DB didn't become available even after " + CONTRACT_HELPER_DB_MAX_AVAILABILITY_CHECK_RETRIES + " retries with " + CONTRACT_HELPER_DB_MILLIS_BETWEEN_AVAILABILITY_CHECK_RETRIES + "s between retries"
    ));
}