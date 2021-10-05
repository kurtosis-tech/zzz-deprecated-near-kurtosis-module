import { NetworkContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";

const SERVICE_ID: ServiceID = "wamp";
const IMAGE: string = "kurtosistech/near-explorer_wamp";
const PORT_NUM: number = 8080;
const DOCKER_PORT_DESC: string = PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
const SHARED_WAMP_BACKEND_SECRET_ENVVAR: string = "WAMP_NEAR_EXPLORER_BACKEND_SECRET";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "WAMP_NEAR_EXPLORER_PORT": PORT_NUM.toString(),
}));

export class ExplorerWampInfo {
    private readonly internalUrl: string;
    // This will only be set if debug mode is set
    private readonly maybeHostMachineUrl: string | undefined;

    constructor(
        internalUrl: string,
        maybeHostMachineUrl: string | undefined,
    ) {
        this.internalUrl = internalUrl;
        this.maybeHostMachineUrl = maybeHostMachineUrl;
    }

    public getInternalUrl(): string {
        return this.internalUrl;
    }

    public getMaybeHostMachineUrl(): string | undefined {
        return this.maybeHostMachineUrl;
    }
}

export async function addExplorerWampService(
    networkCtx: NetworkContext,
    sharedWampBackendSecret: string,
): Promise<Result<ExplorerWampInfo, Error>> {
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(DOCKER_PORT_DESC)

    const envVars: Map<string, string> = new Map(STATIC_ENVVARS);
    envVars.set(SHARED_WAMP_BACKEND_SECRET_ENVVAR, sharedWampBackendSecret);

    const containerConfigSupplier: (ipAddr: string, sharedDirpath: SharedPath) => Result<ContainerConfig, Error> = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withUsedPorts(
            usedPortsSet,
        ).withEnvironmentVariableOverrides(
            envVars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const [serviceCtx, hostMachinePortBindings] = addServiceResult.value;

    const internalUrl: string = buildWsUrl(SERVICE_ID, PORT_NUM);

    const maybeHostMachinePortBinding: PortBinding | undefined = hostMachinePortBindings.get(DOCKER_PORT_DESC);
    const formExternalUrlResult: Result<string | undefined, Error> = tryToFormHostMachineUrl(
        maybeHostMachinePortBinding,
        buildWsUrl
    );
    if (formExternalUrlResult.isErr()) {
        return err(formExternalUrlResult.error);
    }
    const maybeHostMachineUrl: string | undefined = formExternalUrlResult.value;

    const result: ExplorerWampInfo = new ExplorerWampInfo(
        internalUrl,
        maybeHostMachineUrl,
    );

    return ok(result);
}

function buildWsUrl(hostname: string, portNum: number): string {
    return `ws://${hostname}:${portNum}/ws`
}