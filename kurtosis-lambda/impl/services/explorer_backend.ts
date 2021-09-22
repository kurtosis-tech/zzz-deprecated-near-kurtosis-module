import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";
import { ContainerRunConfigSupplier, } from "../near_lambda";

// Explorer Backend
const SERVICE_ID: ServiceID = "backend";
const IMAGE: string = "near-explorer_backend";
// "WAMP_NEAR_EXPLORER_URL": "ws://" + EXPLORER_WAMP_SERVICE_ID + ":" + EXPLORER_WAMP_PORT_NUM + "/ws",
const WAMP_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_URL";
const SHARED_WAMP_BACKEND_SECRET_ENVVAR: string = "WAMP_NEAR_EXPLORER_BACKEND_SECRET";
const ENTRYPOINT_ARGS: string[] = [
    "npm", 
    "run", 
    "start:testnet-with-indexer"
];

export async function addExplorerBackendService(
    networkCtx: NetworkContext,
    wampInternalUrl: string,
    sharedWampBackendSecret: string,
): Promise<Result<null, Error>> {
    const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
        IMAGE,
    ).build();

    const envVars: Map<string, string> = new Map();
    envVars.set(
        WAMP_URL_ENVVAR,
        wampInternalUrl,
    )
    envVars.set(
        SHARED_WAMP_BACKEND_SECRET_ENVVAR,
        sharedWampBackendSecret,
    )
    const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
        const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
            envVars
        ).withEntrypointOverride(
            ENTRYPOINT_ARGS
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    return ok(null);
}