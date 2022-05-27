import { FilesArtifactUUID, EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, ServiceContext, PortSpec, PortProtocol } from "kurtosis-core-api-lib";
import * as log from "loglevel";
import { Result, ok, err } from "neverthrow";
import { EXEC_COMMAND_SUCCESS_EXIT_CODE } from "../consts";
import { ContainerConfigSupplier } from "../near_module";
import { getPrivateAndPublicUrlsForPortId, ServiceUrl } from "../service_url";
import * as path from "path";

const SERVICE_ID: ServiceID = "indexer-node"
const IMAGE: string = "kurtosistech/near-indexer-for-explorer:7510e7f";
const RPC_PRIVATE_PORT_NUM: number = 3030;
const RPC_PUBLIC_PORT_NUM: number = 8332;
const RPC_PORT_ID = "rpc";
const RPC_PRIVATE_PORT_SPEC = new PortSpec(RPC_PRIVATE_PORT_NUM, PortProtocol.TCP);
const RPC_PUBLIC_PORT_SPEC = new PortSpec(RPC_PUBLIC_PORT_NUM, PortProtocol.TCP);
const RPC_PORT_PROTOCOL = "http";
const GOSSIP_PRIVATE_PORT_NUM: number = 24567;
const GOSSIP_PUBLIC_PORT_NUM: number = 8333;
const GOSSIP_PORT_ID = "gossip";
const GOSSIP_PRIVATE_PORT_SPEC = new PortSpec(GOSSIP_PRIVATE_PORT_NUM, PortProtocol.TCP);
const GOSSIP_PUBLIC_PORT_SPEC = new PortSpec(GOSSIP_PUBLIC_PORT_NUM, PortProtocol.TCP);

const LOCALNET_CONFIG_DIRPATH_ON_MODULE = "/static-files/near-configs/localnet"
const NEAR_CONFIGS_DIRPATH_ON_INDEXER_CONTAINER = "/root/.near"

const DATABASE_URL_ENVVAR = "DATABASE_URL";

const VALIDATOR_KEY_FILEPATH: string = "/root/.near/localnet/validator_key.json";
const GET_VALIDATOR_KEY_CMD: string[] = [
    "cat",
    VALIDATOR_KEY_FILEPATH
]

const MAX_NUM_GET_VALIDATOR_KEY_RETRIES: number = 20;
const MILLIS_BETWEEN_GET_VALIDATOR_KEY_RETRIES: number = 500;

export class IndexerInfo {
    constructor(
        public readonly privateRpcUrl: ServiceUrl,
        public readonly publicRpcUrl: ServiceUrl,
        public readonly validatorKey: Object,
    ) {}
}

export async function addIndexer(
    enclaveCtx: EnclaveContext,
    dbPrivateUrl: ServiceUrl,
    dbUsername: string,
    dbUserPassword: string,
    dbName: string,
): Promise<Result<IndexerInfo, Error>> {
    log.info(`Adding indexer service...`);

    // Send the genesis file to Kurtosis
    const uploadLocalnetConfigResult = await enclaveCtx.uploadFiles(LOCALNET_CONFIG_DIRPATH_ON_MODULE)
    if (uploadLocalnetConfigResult.isErr()) {
        return err(uploadLocalnetConfigResult.error)
    }
    const localnetConfigFilesArtifactUuid = uploadLocalnetConfigResult.value;

    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(RPC_PORT_ID, RPC_PRIVATE_PORT_SPEC);
    usedPorts.set(GOSSIP_PORT_ID, GOSSIP_PRIVATE_PORT_SPEC);

    const publicPorts: Map<string, PortSpec> = new Map();
    publicPorts.set(RPC_PORT_ID, RPC_PUBLIC_PORT_SPEC);
    publicPorts.set(GOSSIP_PORT_ID, GOSSIP_PUBLIC_PORT_SPEC);

    const envvars: Map<string, string> = new Map();
    envvars.set(
        DATABASE_URL_ENVVAR,
        `postgres://${dbUsername}:${dbUserPassword}@${dbPrivateUrl.ipAddress}:${dbPrivateUrl.portNumber}/${dbName}`
    )

    const localnetConfigDirpath = path.join(
        NEAR_CONFIGS_DIRPATH_ON_INDEXER_CONTAINER,
        path.basename(LOCALNET_CONFIG_DIRPATH_ON_MODULE),
    )
    const commandToRun = `./diesel migration run && ./indexer-explorer --home-dir "${localnetConfigDirpath}" run --store-genesis sync-from-latest`

    const filesArtifactMounts = new Map<FilesArtifactUUID, string>();
    filesArtifactMounts.set(localnetConfigFilesArtifactUuid, NEAR_CONFIGS_DIRPATH_ON_INDEXER_CONTAINER)

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withEnvironmentVariableOverrides(
            envvars
        ).withEntrypointOverride([
            "sh",
            "-c",
        ]).withCmdOverride([
            commandToRun,
        ]).withUsedPorts(
            usedPorts
        ).withPublicPorts(
            publicPorts,
        ).withFiles(
            filesArtifactMounts,
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const serviceCtx = addServiceResult.value;

    const getValidatorKeyResult: Result<string, Error> = await getValidatorKeyWithRetry(serviceCtx);
    if (getValidatorKeyResult.isErr()) {
        return err(getValidatorKeyResult.error);
    }
    const validatorKeyStr: string = getValidatorKeyResult.value;

    let validatorKey: Object;
    try {
        validatorKey = JSON.parse(validatorKeyStr);
    } catch (e: any) {
        // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
        // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
        if (e && e.stack && e.message) {
            return err(e as Error);
        }
        return err(new Error(
            `JSON-parsing validator key string ${validatorKeyStr} threw an exception, but ` +
                `it's not an Error so we can't report any more information than this`
        ));
    }

    const getRpcUrlsResult = getPrivateAndPublicUrlsForPortId(
        serviceCtx,
        RPC_PORT_ID,
        RPC_PORT_PROTOCOL,
        "",
    );
    if (getRpcUrlsResult.isErr()) {
        return err(getRpcUrlsResult.error);
    }
    const [privateRpcUrl, publicRpcUrl] = getRpcUrlsResult.value;

    const result: IndexerInfo = new IndexerInfo(
        privateRpcUrl,
        publicRpcUrl,
        validatorKey,
    );

    

    return ok(result);
}

async function getValidatorKeyWithRetry(serviceCtx: ServiceContext): Promise<Result<string, Error>> {
    for (let i = 0; i < MAX_NUM_GET_VALIDATOR_KEY_RETRIES; i++) {
        const getValidatorKeyResult: Result<[number, string], Error> = await serviceCtx.execCommand(GET_VALIDATOR_KEY_CMD);
        if (getValidatorKeyResult.isOk()) {
            const [getValidatorKeyExitCode, getValidatorKeyLogOutput] = getValidatorKeyResult.value;
            if (getValidatorKeyExitCode === EXEC_COMMAND_SUCCESS_EXIT_CODE) {
                return ok(getValidatorKeyLogOutput);
            }
        }
        await new Promise(resolve => setTimeout(resolve, MILLIS_BETWEEN_GET_VALIDATOR_KEY_RETRIES));
    }
    return err(new Error(`Couldn't get the node's validator key, even after ${MAX_NUM_GET_VALIDATOR_KEY_RETRIES} retries with ${MILLIS_BETWEEN_GET_VALIDATOR_KEY_RETRIES}ms between retries`))
}