import { EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, ServiceContext, PortSpec, PortProtocol } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { ContainerConfigSupplier } from "../near_module";
import { waitForPortAvailability } from "../service_port_availability_checker";
import { getPrivateAndPublicUrlsForPortId, ServiceUrl } from "../service_url";

const SERVICE_ID: ServiceID = "explorer-wamp";
const IMAGE: string = "kurtosistech/near-explorer_wamp";
const PORT_ID = "ws";
const PRIVATE_PORT_NUM: number = 8080;
const PRIVATE_PORT_SPEC = new PortSpec(PRIVATE_PORT_NUM, PortProtocol.TCP);

const PORT_PROTOCOL = "ws";
const URL_PATH = "/ws";

const SHARED_WAMP_BACKEND_SECRET_ENVVAR: string = "WAMP_NEAR_EXPLORER_BACKEND_SECRET";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "WAMP_NEAR_EXPLORER_PORT": PRIVATE_PORT_NUM.toString(),
}));

const MILLIS_BETWEEN_PORT_AVAILABILITY_RETRIES: number = 500;
const PORT_AVAILABILITY_TIMEOUT_MILLIS:  number = 5_000;

export class ExplorerWampInfo {
    constructor(
        public readonly privateUrl: ServiceUrl,
        public readonly publicUrl: ServiceUrl,
    ) {}
}

export async function addExplorerWampService(
    enclaveCtx: EnclaveContext,
    sharedWampBackendSecret: string,
): Promise<Result<ExplorerWampInfo, Error>> {
    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PRIVATE_PORT_SPEC);

    const envVars: Map<string, string> = new Map(STATIC_ENVVARS);
    envVars.set(SHARED_WAMP_BACKEND_SECRET_ENVVAR, sharedWampBackendSecret);

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withUsedPorts(
            usedPorts,
        ).withEnvironmentVariableOverrides(
            envVars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const serviceCtx  = addServiceResult.value;

    /*
    const waitForPortAvailabilityResult = await waitForPortAvailability(
        PRIVATE_PORT_NUM,
        serviceCtx.getPrivateIPAddress(),
        MILLIS_BETWEEN_PORT_AVAILABILITY_RETRIES,
        PORT_AVAILABILITY_TIMEOUT_MILLIS,
    )
    if (waitForPortAvailabilityResult.isErr()) {
        return err(waitForPortAvailabilityResult.error);
    }
    */

    const getUrlsResult = getPrivateAndPublicUrlsForPortId(
        serviceCtx,
        PORT_ID,
        PORT_PROTOCOL,
        URL_PATH,
    );
    if (getUrlsResult.isErr()) {
        return err(getUrlsResult.error);
    }
    const [privateUrl, publicUrl] = getUrlsResult.value;

    const result: ExplorerWampInfo = new ExplorerWampInfo(
        privateUrl,
        publicUrl,
    );

    return ok(result);
}