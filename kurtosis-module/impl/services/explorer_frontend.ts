import { EnclaveContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortSpec, PortProtocol } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { tryToFormHostMachineUrl } from "../consts";
import { ContainerConfigSupplier } from "../near_module";

const SERVICE_ID: ServiceID = "explorer-frontend";
const PORT_ID = "http";
// TODO DEBUGGING
// const IMAGE: string = "kurtosistech/near-explorer_frontend";
const IMAGE: string = "kurtosistech/near-explorer_frontend:2022-02-09";
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
    enclaveCtx: EnclaveContext, 
    wampInternalUrl: string,
    maybeHostMachineWampUrl: string | undefined,
    networkName: string,
): Promise<Result<ExplorerFrontendInfo, Error>> {
    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, PORT_SPEC);

    const envVars: Map<string, string> = new Map(STATIC_ENVVARS);
    envVars.set(
        WAMP_INTERNAL_URL_ENVVAR,
        wampInternalUrl,
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
            maybeHostMachineWampUrl,
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

    const maybeHostMachineUrl: string | undefined = tryToFormHostMachineUrl(
        serviceCtx.getMaybePublicIPAddress(),
        serviceCtx.getPublicPorts().get(PORT_ID),
        (ipAddr: string, portNum: number) => `http://${ipAddr}:${portNum}`,
    );

    const result: ExplorerFrontendInfo = new ExplorerFrontendInfo(maybeHostMachineUrl);
    return ok(result);
}