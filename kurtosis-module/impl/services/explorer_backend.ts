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

const NEAR_EXPLORER_BACKEND_PORT_ENVVAR: string = "NEAR_EXPLORER_CONFIG__PORT"

// These environment variables come from https://github.com/near/near-explorer/blob/master/mainnet.env
const NEAR_READ_ONLY_INDEXER_DATABASE_USERNAME_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_INDEXER__USER";
const NEAR_READ_ONLY_INDEXER_DATABASE_PASSWORD_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_INDEXER__PASSWORD";
const NEAR_READ_ONLY_INDEXER_DATABASE_HOST_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_INDEXER__HOST";
const NEAR_READ_ONLY_INDEXER_DATABASE_NAME_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_INDEXER__DATABASE";

// These environment variables come from https://github.com/near/near-explorer/blob/master/mainnet.env
const NEAR_READ_ONLY_ANALYTICS_DATABASE_USERNAME_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_ANALYTICS__USER";
const NEAR_READ_ONLY_ANALYTICS_DATABASE_PASSWORD_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_ANALYTICS__PASSWORD";
const NEAR_READ_ONLY_ANALYTICS_DATABASE_HOST_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_ANALYTICS__HOST";
const NEAR_READ_ONLY_ANALYTICS_DATABASE_NAME_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_ANALYTICS__DATABASE";

// These environment variables come from https://github.com/near/near-explorer/blob/master/mainnet.env
const NEAR_READ_ONLY_TELEMETRY_DATABASE_USERNAME_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_TELEMETRY__USER";
const NEAR_READ_ONLY_TELEMETRY_DATABASE_PASSWORD_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_TELEMETRY__PASSWORD";
const NEAR_READ_ONLY_TELEMETRY_DATABASE_HOST_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_TELEMETRY__HOST";
const NEAR_READ_ONLY_TELEMETRY_DATABASE_NAME_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__READ_ONLY_TELEMETRY__DATABASE";
const NEAR_WRITE_ONLY_TELEMETRY_DATABASE_USERNAME_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__WRITE_ONLY_TELEMETRY__USER";
const NEAR_WRITE_ONLY_TELEMETRY_DATABASE_PASSWORD_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__WRITE_ONLY_TELEMETRY__PASSWORD";
const NEAR_WRITE_ONLY_TELEMETRY_DATABASE_HOST_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__WRITE_ONLY_TELEMETRY__HOST";
const NEAR_WRITE_ONLY_TELEMETRY_DATABASE_NAME_ENVVAR: string = "NEAR_EXPLORER_CONFIG__DB__WRITE_ONLY_TELEMETRY__DATABASE";

const NEAR_ARCHIVAL_RPC_URL_ENVVAR: string = "NEAR_EXPLORER_CONFIG__ARCHIVAL_RPC_URL";

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
): Promise<Result<ExplorerBackendInfo, Error>> {
    log.info(`Adding explorer backend service`);

    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PRIVATE_PORT_SPEC);

    // Variables from https://github.com/near/near-explorer/blob/master/backend/src/config.ts
    const envVars: Map<string, string> = new Map([
        // TODO MAKE THIS MATCH BACKEND
        [NEAR_EXPLORER_BACKEND_PORT_ENVVAR, PRIVATE_PORT_NUM.toString()],

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


        [NEAR_ARCHIVAL_RPC_URL_ENVVAR, nearNodePrivateRpcUrl.toString()],
    ]);

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withEnvironmentVariableOverrides(
            envVars
        ).withUsedPorts(
            usedPorts,
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfigSupplier);
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
