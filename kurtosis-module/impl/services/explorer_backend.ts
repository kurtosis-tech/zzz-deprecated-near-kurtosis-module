import { EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, ServiceContext, } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { ContainerConfigSupplier } from "../near_module";
import { ServiceUrl } from "../service_url";

// Explorer Backend
const SERVICE_ID: ServiceID = "explorer-backend";
const IMAGE: string = "kurtosistech/near-explorer_backend:5ef5b6c";
const NEAR_NODE_RPC_URL_ENVVAR: string = "NEAR_RPC_URL";

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

const WAMP_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_URL";
const SHARED_WAMP_BACKEND_SECRET_ENVVAR: string = "WAMP_NEAR_EXPLORER_BACKEND_SECRET";
const NETWORK_NAME_ENVVAR: string = "WAMP_NEAR_NETWORK_NAME";

const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "NEAR_IS_LEGACY_SYNC_BACKEND_ENABLED": "false",
    "NEAR_IS_INDEXER_BACKEND_ENABLED": "true",
}));

export async function addExplorerBackendService(
    enclaveCtx: EnclaveContext,
    nearNodePrivateRpcUrl: ServiceUrl,
    indexerDbPrivateUrl: ServiceUrl,
    indexerDbUsername: string,
    indexerDbUserPassword: string,
    indexerDbName: string,
    analyticsDbName: string,
    telemetryDbName: string,
    wampPrivateUrl: ServiceUrl,
    sharedWampBackendSecret: string,
    networkName: string,
): Promise<Result<null, Error>> {
    const envVars: Map<string, string> = new Map([
        [NETWORK_NAME_ENVVAR, networkName],

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

        [WAMP_URL_ENVVAR, wampPrivateUrl.toString()],
        [SHARED_WAMP_BACKEND_SECRET_ENVVAR, sharedWampBackendSecret],
        [NEAR_NODE_RPC_URL_ENVVAR, nearNodePrivateRpcUrl.toString()],
    ]);
    for (let [key, value] of STATIC_ENVVARS.entries()) {
        envVars.set(key, value);
    }

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withEnvironmentVariableOverrides(
            envVars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    return ok(null);
}
