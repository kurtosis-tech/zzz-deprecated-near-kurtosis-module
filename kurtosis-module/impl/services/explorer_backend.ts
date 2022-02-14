import { EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { ContainerConfigSupplier } from "../near_module";

// Explorer Backend
const SERVICE_ID: ServiceID = "explorer-backend";
// TODO DEBUGGIN
// const IMAGE: string = "kurtosistech/near-explorer_backend";
const IMAGE: string = "kurtosistech/near-explorer_backend:2022-02-09";
const NEAR_NODE_RPC_URL_ENVVAR: string = "NEAR_RPC_URL";

const NEAR_INDEXER_DATABASE_USERNAME_ENVVAR: string = "NEAR_INDEXER_DATABASE_USERNAME";
const NEAR_INDEXER_DATABASE_PASSWORD_ENVVAR: string = "NEAR_INDEXER_DATABASE_PASSWORD";
const NEAR_INDEXER_DATABASE_HOST_ENVVAR: string = "NEAR_INDEXER_DATABASE_HOST";
const NEAR_INDEXER_DATABASE_NAME_ENVVAR: string = "NEAR_INDEXER_DATABASE_NAME";

const WAMP_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_URL";
const SHARED_WAMP_BACKEND_SECRET_ENVVAR: string = "WAMP_NEAR_EXPLORER_BACKEND_SECRET";
const NETWORK_NAME_ENVVAR: string = "WAMP_NEAR_NETWORK_NAME";

const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "NEAR_IS_LEGACY_SYNC_BACKEND_ENABLED": "false",
    "NEAR_IS_INDEXER_BACKEND_ENABLED": "true",
}));

export async function addExplorerBackendService(
    enclaveCtx: EnclaveContext,
    nearNodeHostname: string,
    nearNodeRpcPortNum: number,
    indexerDbUsername: string,
    indexerDbUserPassword: string,
    indexerDbHostname: string,
    indexerDbName: string,
    wampInternalUrl: string,
    sharedWampBackendSecret: string,
    networkName: string,
): Promise<Result<null, Error>> {
    const envVars: Map<string, string> = new Map([
        [NETWORK_NAME_ENVVAR, networkName],
        [NEAR_INDEXER_DATABASE_USERNAME_ENVVAR, indexerDbUsername],
        [NEAR_INDEXER_DATABASE_PASSWORD_ENVVAR, indexerDbUserPassword],
        [NEAR_INDEXER_DATABASE_HOST_ENVVAR, indexerDbHostname],
        [NEAR_INDEXER_DATABASE_NAME_ENVVAR, indexerDbName],
        [WAMP_URL_ENVVAR, wampInternalUrl],
        [SHARED_WAMP_BACKEND_SECRET_ENVVAR, sharedWampBackendSecret],
        [NEAR_NODE_RPC_URL_ENVVAR, `http://${nearNodeHostname}:${nearNodeRpcPortNum}`],
    ]);
    for (let [key, value] of STATIC_ENVVARS.entries()) {
        envVars.set(key, value);
    }

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
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
