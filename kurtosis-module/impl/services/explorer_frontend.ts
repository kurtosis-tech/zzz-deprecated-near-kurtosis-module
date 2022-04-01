import { EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortSpec, PortProtocol } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { ContainerConfigSupplier } from "../near_module";
import { getPrivateAndPublicUrlsForPortId, ServiceUrl } from "../service_url";

const SERVICE_ID: ServiceID = "explorer-frontend";
const PORT_ID = "http";
const PORT_PROTOCOL = "http";
const IMAGE: string = "kurtosistech/near-explorer_frontend:5ef5b6c";
const PORT_NUM: number = 3000;
const PORT_SPEC = new PortSpec(PORT_NUM, PortProtocol.TCP);

const WAMP_INTERNAL_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_INTERNAL_URL";
const WAMP_EXTERNAL_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_URL";
const NEAR_NETWORKS_ENVVAR: string = "NEAR_NETWORKS";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "PORT": PORT_NUM.toString(),
    "NEAR_EXPLORER_DATA_SOURCE": "INDEXER_BACKEND", // Tells the frontend to use the indexer backend, rather than the legacy sqlite backend
    // It's not clear what this value does - it's pulled as-is from https://github.com/near/near-explorer/blob/master/frontend/package.json#L31
    // "NEAR_NETWORKS": "[{\"name\": \"localnet\", \"explorerLink\": \"http://localhost:3000/\", \"aliases\": [\"localhost:3000\", \"127.0.0.1:3000\"], \"nearWalletProfilePrefix\": \"https://wallet.testnet.near.org/profile\"}]",
}));

export class ExplorerFrontendInfo {
    constructor (
        public readonly publicUrl: ServiceUrl,
    ) {}
}

export async function addExplorerFrontendService(
    enclaveCtx: EnclaveContext, 
    wampInternalUrl: ServiceUrl,
    maybeHostMachineWampUrl: ServiceUrl | undefined,
    networkName: string,
): Promise<Result<ExplorerFrontendInfo, Error>> {
    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PORT_SPEC);

    const envVars: Map<string, string> = new Map(STATIC_ENVVARS);
    envVars.set(
        WAMP_INTERNAL_URL_ENVVAR,
        wampInternalUrl.toString(),
    )
    envVars.set(
        NEAR_NETWORKS_ENVVAR,
        `[{\"name\": \"${networkName}\", \"explorerLink\": \"http://localhost:3000/\", \"aliases\": [\"localhost:3000\", \"127.0.0.1:3000\"], \"nearWalletProfilePrefix\": \"https://wallet.testnet.near.org/profile\"}]`,
    )
    // If there's no host machine WAMP URL (i.e. Kurtosis isn't running in debug mode) then we can't set the
    //  WAMP Docker-external variable
    if (maybeHostMachineWampUrl !== undefined) {
        envVars.set(
            WAMP_EXTERNAL_URL_ENVVAR, 
            maybeHostMachineWampUrl.toString(),
        );
    }

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
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
    const serviceCtx = addServiceResult.value;

    const getUrlsResult = getPrivateAndPublicUrlsForPortId(
        serviceCtx,
        PORT_ID,
        PORT_PROTOCOL,
        "",
    );
    if (getUrlsResult.isErr()) {
        return err(getUrlsResult.error);
    }
    const [privateUrl, publicUrl] = getUrlsResult.value;

    const result: ExplorerFrontendInfo = new ExplorerFrontendInfo(publicUrl);
    return ok(result);
}