import { NetworkContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";

// Explorer Backend
const SERVICE_ID: ServiceID = "backend";
const IMAGE: string = "kurtosistech/near-explorer_backend";
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
    networkCtx: NetworkContext,
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

    const containerConfigSupplier: (ipAddr: string, sharedDirpath: SharedPath) => Result<ContainerConfig, Error> = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withEnvironmentVariableOverrides(
            envVars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    return ok(null);
}
