import { EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortSpec, PortProtocol } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { EXEC_COMMAND_SUCCESS_EXIT_CODE, tryToFormHostMachineUrl } from "../consts";
import { ContainerConfigSupplier } from "../near_module";

const SERVICE_ID: ServiceID = "indexer"
// TODO UPDATE
// const IMAGE: string = "kurtosistech/near-indexer-for-explorer:0.2.0";
const IMAGE: string = "test-new-indexer";
const PORT_NUM: number = 3030;
const PORT_ID = "rpc";
const PORT_SPEC = new PortSpec(PORT_NUM, PortProtocol.TCP);

const DATABASE_URL_ENVVAR = "DATABASE_URL";

const VALIDATOR_KEY_FILEPATH: string = "/root/.near/localnet/validator_key.json";
const GET_VALIDATOR_KEY_CMD: string[] = [
    "cat",
    VALIDATOR_KEY_FILEPATH
]

const MAX_NUM_GET_VALIDATOR_KEY_RETRIES: number = 20;
const MILLIS_BETWEEN_GET_VALIDATOR_KEY_RETRIES: number = 500;

export class IndexerInfo {
    private readonly networkInternalHostname: string;
    private readonly networkInternalPortNum: number;
    // Will only be set if debug mode is enabled
    private readonly maybeHostMachineUrl: string | undefined;
    private readonly validatorKey: Object;

    constructor(
        networkInternalHostname: string,
        networkInternalPortNum: number,
        maybeHostMachineUrl: string | undefined,
        validatorKey: Object,
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

    public getValidatorKey(): Object {
        return this.validatorKey;
    }
}

export async function addIndexer(
    enclaveCtx: EnclaveContext,
    dbHostname: string,
    dbPortNum: number,
    dbUsername: string,
    dbUserPassword: string,
    dbName: string,
): Promise<Result<IndexerInfo, Error>> {
    log.info(`Adding indexer service...`);
    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PORT_SPEC);

    const envvars: Map<string, string> = new Map();
    envvars.set(
        DATABASE_URL_ENVVAR,
        `postgres://${dbUsername}:${dbUserPassword}@${dbHostname}:${dbPortNum}/${dbName}`
    )

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withUsedPorts(
            usedPorts
        ).withEnvironmentVariableOverrides(
            envvars
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

    const maybeHostMachineUrl: string | undefined = tryToFormHostMachineUrl(
        serviceCtx.getMaybePublicIPAddress(),
        serviceCtx.getPublicPorts().get(PORT_ID),
        (ipAddr: string, portNum: number) => `http://${ipAddr}:${portNum}`
    )

    const result: IndexerInfo = new IndexerInfo(
        SERVICE_ID,
        PORT_NUM,
        maybeHostMachineUrl,
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