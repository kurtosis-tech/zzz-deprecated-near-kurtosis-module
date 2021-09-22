import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";
import { ContainerRunConfigSupplier, } from "../near_lambda";

const SERVICE_ID: ServiceID = "frontend";
// TODO replace with something from Dockerhub
const IMAGE: string = "near-explorer_frontend";
const PORT_NUM: number = 3000;
const DOCKER_PORT_DESC: string = PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
const WAMP_INTERNAL_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_INTERNAL_URL";
const WAMP_EXTERNAL_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_URL";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "PORT": PORT_NUM.toString(),
    "NEAR_EXPLORER_DATA_SOURCE": "INDEXER_BACKEND",
    // It's not clear what this value does - it's pulled as-is from https://github.com/near/near-explorer/blob/master/frontend/package.json#L31
    "NEAR_NETWORKS": "[{\"name\": \"testnet\", \"explorerLink\": \"http://localhost:3000/\", \"aliases\": [\"localhost:3000\", \"127.0.0.1:3000\"], \"nearWalletProfilePrefix\": \"https://wallet.testnet.near.org/profile\"}]",
}));

export class ExplorerFrontendInfo {
    private readonly maybeHostMachineUrl: string | undefined;

    constructor (
        maybeHostMachineUrl: string | undefined,
    ) {
        this.maybeHostMachineUrl = maybeHostMachineUrl;
    }

    public getMaybeHostMachineUrl(): string | undefined {
        return this.maybeHostMachineUrl;
    }
}

export async function addExplorerFrontendService(
    networkCtx: NetworkContext, 
    wampInternalUrl: string,
    maybeHostMachineWampUrl: string | undefined,
    // wampHostMachinePortBindingOpt?: PortBinding,
): Promise<Result<ExplorerFrontendInfo, Error>> {
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(DOCKER_PORT_DESC)
    const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
        IMAGE,
    ).withUsedPorts(
        usedPortsSet,
    ).build();


    const envVars: Map<string, string> = new Map(STATIC_ENVVARS);
    envVars.set(
        WAMP_INTERNAL_URL_ENVVAR,
        wampInternalUrl,
    )
    // If there's no host machine WAMP URL (i.e. Kurtosis isn't running in debug mode) then we can't set the
    //  WAMP Docker-external variable
    if (maybeHostMachineWampUrl !== undefined) {
        envVars.set(
            WAMP_EXTERNAL_URL_ENVVAR, 
            maybeHostMachineWampUrl,
        );
    }
    const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
        const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
            envVars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const [serviceCtx, hostMachinePortBindings] = addServiceResult.value;

    const maybeHostMachinePortBinding: PortBinding | undefined = hostMachinePortBindings.get(DOCKER_PORT_DESC);
    const formUrlResult: Result<string | undefined, Error> = tryToFormHostMachineUrl(
        maybeHostMachinePortBinding,
        (ipAddr: string, portNum: number) => `http://${ipAddr}:${portNum}`,
    );
    if (formUrlResult.isErr()) {
        return err(formUrlResult.error);
    }
    const maybeHostMachineUrl: string | undefined = formUrlResult.value;

    const result: ExplorerFrontendInfo = new ExplorerFrontendInfo(maybeHostMachineUrl);
    return ok(result);
}