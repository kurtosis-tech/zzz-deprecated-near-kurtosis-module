import { EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, ServiceContext, PortSpec, PortProtocol, } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { ContainerConfigSupplier } from "../near_module";
import { getPrivateAndPublicUrlsForPortId, ServiceUrl } from "../service_url";

// Explorer Backend
const SERVICE_ID: ServiceID = "explorer-backend";
const IMAGE: string = "kurtosistech/near-explorer_backend:924c832";
const PORT_ID = "http";
const PORT_APP_PROTOCOL = "http"
const PRIVATE_PORT_NUM: number = 8080;
const PRIVATE_PORT_SPEC = new PortSpec(PRIVATE_PORT_NUM, PortProtocol.TCP);
const URL_PATH = ""

const NEAR_NODE_RPC_URL_ENVVAR: string = "NEAR_RPC_URL";
const PORT_ENVVAR: string = "NEAR_EXPLORER_CONFIG__PORT"

// These environment variables come from https://github.com/near/near-explorer/blob/master/backend/config/env-indexer-mainnet
const NEAR_READ_ONLY_INDEXER_DATABASE_USERNAME_ENVVAR: string = "NEAR_READ_ONLY_INDEXER_DATABASE_USERNAME";
const NEAR_READ_ONLY_INDEXER_DATABASE_PASSWORD_ENVVAR: string = "NEAR_READ_ONLY_INDEXER_DATABASE_PASSWORD";
const NEAR_READ_ONLY_INDEXER_DATABASE_HOST_ENVVAR: string =     "NEAR_READ_ONLY_INDEXER_DATABASE_HOST";
const NEAR_READ_ONLY_INDEXER_DATABASE_NAME_ENVVAR: string =     "NEAR_READ_ONLY_INDEXER_DATABASE_NAME";

// These environment variables come from https://github.com/near/near-explorer/blob/master/backend/config/env-indexer-mainnet
const NEAR_READ_ONLY_ANALYTICS_DATABASE_USERNAME_ENVVAR: string = "NEAR_READ_ONLY_ANALYTICS_DATABASE_USERNAME";
const NEAR_READ_ONLY_ANALYTICS_DATABASE_PASSWORD_ENVVAR: string = "NEAR_READ_ONLY_ANALYTICS_DATABASE_PASSWORD";
const NEAR_READ_ONLY_ANALYTICS_DATABASE_HOST_ENVVAR: string = "NEAR_READ_ONLY_ANALYTICS_DATABASE_HOST";
const NEAR_READ_ONLY_ANALYTICS_DATABASE_NAME_ENVVAR: string = "NEAR_READ_ONLY_ANALYTICS_DATABASE_NAME";

// These environment variables come from https://github.com/near/near-explorer/blob/master/backend/config/env-indexer-mainnet
const NEAR_READ_ONLY_TELEMETRY_DATABASE_USERNAME_ENVVAR: string = "NEAR_READ_ONLY_TELEMETRY_DATABASE_USERNAME";
const NEAR_READ_ONLY_TELEMETRY_DATABASE_PASSWORD_ENVVAR: string = "NEAR_READ_ONLY_TELEMETRY_DATABASE_PASSWORD";
const NEAR_READ_ONLY_TELEMETRY_DATABASE_HOST_ENVVAR: string = "NEAR_READ_ONLY_TELEMETRY_DATABASE_HOST";
const NEAR_READ_ONLY_TELEMETRY_DATABASE_NAME_ENVVAR: string = "NEAR_READ_ONLY_TELEMETRY_DATABASE_NAME";
const NEAR_WRITE_ONLY_TELEMETRY_DATABASE_USERNAME_ENVVAR: string = "NEAR_WRITE_ONLY_TELEMETRY_DATABASE_USERNAME";
const NEAR_WRITE_ONLY_TELEMETRY_DATABASE_PASSWORD_ENVVAR: string = "NEAR_WRITE_ONLY_TELEMETRY_DATABASE_PASSWORD";
const NEAR_WRITE_ONLY_TELEMETRY_DATABASE_HOST_ENVVAR: string = "NEAR_WRITE_ONLY_TELEMETRY_DATABASE_HOST";
const NEAR_WRITE_ONLY_TELEMETRY_DATABASE_NAME_ENVVAR: string = "NEAR_WRITE_ONLY_TELEMETRY_DATABASE_NAME";

// const WAMP_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_URL";
// const SHARED_WAMP_BACKEND_SECRET_ENVVAR: string = "WAMP_NEAR_EXPLORER_BACKEND_SECRET";
// const NETWORK_NAME_ENVVAR: string = "WAMP_NEAR_NETWORK_NAME";

const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "NEAR_IS_LEGACY_SYNC_BACKEND_ENABLED": "false",
    "NEAR_IS_INDEXER_BACKEND_ENABLED": "true",
}));

export class ExplorerBackendInfo {
    constructor(
        public readonly privateUrl: ServiceUrl,
        public readonly publicUrl: ServiceUrl,
    ) {}
}

export async function addExplorerBackendService(
    enclaveCtx: EnclaveContext,
    nearNodePrivateRpcUrl: ServiceUrl,
    indexerDbPrivateUrl: ServiceUrl,
    indexerDbUsername: string,
    indexerDbUserPassword: string,
    indexerDbName: string,
    analyticsDbName: string,
    telemetryDbName: string,
    /*
    wampPrivateUrl: ServiceUrl,
    sharedWampBackendSecret: string,
    networkName: string,
    */
): Promise<Result<ExplorerBackendInfo, Error>> {
    log.info(`Adding explorer backend service`);

    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PRIVATE_PORT_SPEC);

    // Variables from https://github.com/near/near-explorer/blob/master/backend/src/config.ts
    const envVars: Map<string, string> = new Map([
        // TODO MAKE THIS MATCH BACKEND
        // [NETWORK_NAME_ENVVAR, networkName],
        [PORT_ENVVAR, PRIVATE_PORT_NUM.toString()],

        // Indexer DB envvars
        [NEAR_READ_ONLY_INDEXER_DATABASE_USERNAME_ENVVAR, indexerDbUsername],
        [NEAR_READ_ONLY_INDEXER_DATABASE_PASSWORD_ENVVAR, indexerDbUserPassword],
        [NEAR_READ_ONLY_INDEXER_DATABASE_HOST_ENVVAR, indexerDbPrivateUrl.ipAddress],
        [NEAR_READ_ONLY_INDEXER_DATABASE_NAME_ENVVAR, indexerDbName],

        // Analytics DB envvars
        [NEAR_READ_ONLY_ANALYTICS_DATABASE_USERNAME_ENVVAR, indexerDbUsername],
        [NEAR_READ_ONLY_ANALYTICS_DATABASE_PASSWORD_ENVVAR, indexerDbUserPassword],
        [NEAR_READ_ONLY_ANALYTICS_DATABASE_HOST_ENVVAR, indexerDbPrivateUrl.ipAddress],
        [NEAR_READ_ONLY_ANALYTICS_DATABASE_NAME_ENVVAR, analyticsDbName],

        // Telemetry DB envvars
        [NEAR_READ_ONLY_TELEMETRY_DATABASE_USERNAME_ENVVAR, indexerDbUsername],
        [NEAR_READ_ONLY_TELEMETRY_DATABASE_PASSWORD_ENVVAR, indexerDbUserPassword],
        [NEAR_READ_ONLY_TELEMETRY_DATABASE_HOST_ENVVAR, indexerDbPrivateUrl.ipAddress],
        [NEAR_READ_ONLY_TELEMETRY_DATABASE_NAME_ENVVAR, telemetryDbName],
        [NEAR_WRITE_ONLY_TELEMETRY_DATABASE_USERNAME_ENVVAR, indexerDbUsername],
        [NEAR_WRITE_ONLY_TELEMETRY_DATABASE_PASSWORD_ENVVAR, indexerDbUserPassword],
        [NEAR_WRITE_ONLY_TELEMETRY_DATABASE_HOST_ENVVAR, indexerDbPrivateUrl.ipAddress],
        [NEAR_WRITE_ONLY_TELEMETRY_DATABASE_NAME_ENVVAR, telemetryDbName],


        ["NEAR_EXPLORER_CONFIG__ARCHIVAL_RPC_URL", nearNodePrivateRpcUrl.toString()],

        // [WAMP_URL_ENVVAR, wampPrivateUrl.toString()],
        // [SHARED_WAMP_BACKEND_SECRET_ENVVAR, sharedWampBackendSecret],
        // [NEAR_NODE_RPC_URL_ENVVAR, nearNodePrivateRpcUrl.toString()],
    ]);
    for (let [key, value] of STATIC_ENVVARS.entries()) {
        envVars.set(key, value);
    }

    const containerConfig: ContainerConfig = new ContainerConfigBuilder(
        IMAGE,
    ).withEnvironmentVariableOverrides(
        envVars
    ).withUsedPorts(
        usedPorts,
    ).build();
    
    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfig);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const serviceCtx = addServiceResult.value;

    const getUrlsResult = getPrivateAndPublicUrlsForPortId(
        serviceCtx,
        PORT_ID,
        PORT_APP_PROTOCOL,
        URL_PATH,
    );
    if (getUrlsResult.isErr()) {
        return err(getUrlsResult.error);
    }
    const [privateUrl, publicUrl] = getUrlsResult.value;

    const result: ExplorerBackendInfo = new ExplorerBackendInfo(
        privateUrl,
        publicUrl,
    );

    return ok(result);
}
