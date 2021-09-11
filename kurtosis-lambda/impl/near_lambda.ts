import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import { KurtosisLambda } from "kurtosis-lambda-api-lib";
import { Result, ok, err } from "neverthrow";
import * as log from "loglevel";


const TCP_PROTOCOL: string = "tcp";

const WAMP_BACKEND_SECRET: string = "back";

const DOCKER_PORT_PROTOCOL_SEPARATOR = "/";

// Explorer WAMP
const EXPLORER_WAMP_SERVICE_ID: ServiceID = "wamp";
const EXPLORER_WAMP_IMAGE: string = "near-explorer_wamp";
const EXPLORER_WAMP_PORT_NUM: number = 8080;
const EXPLORER_WAMP_DOCKER_PORT_DESC: string = EXPLORER_WAMP_PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
// const EXPLORER_WAMP_PORT_ENVVAR: string = "WAMP_EXPLORER_PORT";
// const EXPLORER_WAMP_BACKEND_SECRET_ENVVAR: string = "WAMP_EXPLORER_BACKEND_SECRET";

const EXPLORER_WAMP_STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "WAMP_NEAR_EXPLORER_PORT": EXPLORER_WAMP_PORT_NUM.toString(),
    "WAMP_NEAR_EXPLORER_BACKEND_SECRET": WAMP_BACKEND_SECRET,
}));

// Explorer Backend
const EXPLORER_BACKEND_SERVICE_ID: ServiceID = "backend";
const EXPLORER_BACKEND_IMAGE: string = "near-explorer_backend";
const EXPLORER_BACKEND_WAMP_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_URL"
// const EXPLORER_BACKEND_WAMP_SECRET_ENVVAR: string  = "WAMP_EXPLORER_BACKEND_SECRET";
const EXPLORER_BACKEND_STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "WAMP_NEAR_EXPLORER_BACKEND_SECRET": WAMP_BACKEND_SECRET,
}));
const EXPLORER_BACKEND_ENTRYPOINT_ARGS: string[] = [
    "npm", 
    "run", 
    "start:testnet-with-indexer"
];
// TODO Mem limit??

// Explorer Frontend
const EXPLORER_FRONTEND_SERVICE_ID: ServiceID = "frontend";
const EXPLORER_FRONTEND_IMAGE: string = "near-explorer_frontend";
const EXPLORER_FRONTEND_PORT_NUM: number = 3000;
const EXPLORER_FRONTEND_DOCKER_PORT_DESC: string = EXPLORER_FRONTEND_PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
// const EXPLORER_FRONTEND_PORT_ENVVAR: string = "PORT";
const EXPLORER_FRONTEND_WAMP_INTERNAL_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_INTERNAL_URL";
const EXPLORER_FRONTEND_WAMP_EXTERNAL_URL_ENVVAR: string = "WAMP_NEAR_EXPLORER_URL";
// const EXPLORER_FRONTEND_NEAR_NETWORKS_ENVVAR: string = "NEAR_NETWORKS";
// const EXPLORER_FRONTEND_NEAR_NETWORKS_VALUE: string = "[{\"name\": \"testnet\", \"explorerLink\": \"http://localhost:3000/\", \"aliases\": [\"localhost:3000\", \"127.0.0.1:3000\"], \"nearWalletProfilePrefix\": \"https://wallet.testnet.near.org/profile\"}]";
// const EXPLORER_FRONTEND_DATA_SOURCE_ENVVAR: string = "EXPLORER_DATA_SOURCE";
// const EXPLORER_FRONTEND_INDEXER_DATA_SOURCE: string = "INDEXER_BACKEND";

const EXPLORER_FRONTEND_STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "PORT": EXPLORER_FRONTEND_PORT_NUM.toString(),
    "EXPLORER_DATA_SOURCE": "INDEXER_BACKEND",
    // It's not clear what this value does - it's pulled as-is from https://github.com/near/near-explorer/blob/master/frontend/package.json#L31
    "NEAR_NETWORKS": "[{\"name\": \"testnet\", \"explorerLink\": \"http://localhost:3000/\", \"aliases\": [\"localhost:3000\", \"127.0.0.1:3000\"], \"nearWalletProfilePrefix\": \"https://wallet.testnet.near.org/profile\"}]",
}));

type ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error>;

/*
//Contract Helper DB
const CONTRACT_HELPER_DB_SERVICE_ID: ServiceID = "contract-helper-db"
const CONTRACT_HELPER_DB_IMAGE: string = "nearprotocol/contract-helper-db"
const CONTRACT_HELPER_DB_PORT_NUMBER: string = "5432"
const CONTRACT_HELPER_DB_PROTOCOL: string  = "tcp"

//Contract Helper App
const CONTRACT_HELPER_APP_SERVICE_ID: ServiceID = "contract-helper-app"
const CONTRACT_HELPER_APP_IMAGE: string = "nearprotocol/contract-helper-app"
const CONTRACT_HELPER_APP_PORT_NUMBER: string = "3000"
const CONTRACT_HELPER_APP_PROTOCOL: string = "tcp"

//Bridge
const BRIDGE_SERVICE_ID: ServiceID = "bridge"
const BRIDGE_IMAGE: string = "nearprotocol/bridge"
const BRIDGE_PORT_NUMBER_01 = "3030"
const BRIDGE_PORT_NUMBER_02 = "9545"
const BRIDGE_PORT_NUMBER_03 = "8080"
const BRIDGE_PORT_NUMBER_04 = "8081"
const BRIDGE_PORT_NUMBER_05 = "9000"
const BRIDGE_PROTOCOL = "tcp"

//Indexer
const INDEXER_SERVICE_ID: ServiceID = "indexer"
const INDEXER_IMAGE = "nearprotocol/indexer-for-explorer"

//Wallet
const WALLET_SERVICE_ID: ServiceID = "wallet"
const WALLET_IMAGE: string = "walletImage"
const WALLET_PORT_NUMBER: string = "1234"
const WALLET_PROTOCOL: string = "tcp"

//Linkdrop
const LINKDROP_SERVICE_ID: ServiceID = "linkdrop"
const LINKDROP_IMAGE: string = "nearprotocol/linkdrop"

//Explorer Wamp
const EXPLORER_WAMP_SERVICE_ID: ServiceID = "explorer-wamp"
const EXPLORER_WAMP_IMAGE: string = "nearprotocol/explorer-wamp"
const EXPLORER_WAMP_PORT_NUMBER_01: string = "9090"
const EXPLORER_WAMP_PORT_NUMBER_02: string = "8000"
const EXPLORER_WAMP_PORT_NUMBER_03: string = "8080"
const EXPLORER_WAMP_PROTOCOL: string = "tcp"

//Explorer Backend
const EXPLORER_BACKEND_SERVICE_ID: ServiceID = "explorer-backend"
const EXPLORER_BACKEND_IMAGE: string = "nearprotocol/explorer-backend"

//Explorer Frontend
const EXPLORER_FRONTEND_SERVICE_ID: ServiceID = "explorer-frontend"
const EXPLORER_FRONTEND_IMAGE: string = "nearprotocol/explorer-frontend"
const EXPLORER_FRONTEND_PORT_NUMBER: string = "9001"
const EXPLORER_FRONTEND_PROTOCOL = "tcp"

//Bridge Frontend
const BRIDGE_FRONTEND_SERVICE_ID: ServiceID = "bridge-frontend"
const BRIDGE_FRONTEND_IMAGE: string = "nearprotocol/bridge-frontend"
const BRIDGE_FRONTEND_PORT_NUMBER: string = "1234"
const BRIDGE_FRONTEND_PROTOCOL: string = "tcp"
*/

interface NearLambdaParams {
}

class NearLambdaResult {
    // When Kurtosis is in debug mode, the explorer frontend's port will be bound to a port on the user's machine so they can access the frontend
    //  even though the frontend is running inside Docker. When Kurtosis is not in debug mode, this will be null.
    private readonly explorerHostMachineUrl: string | null

    constructor(explorerHostMachineUrl: string | null) {
        this.explorerHostMachineUrl = explorerHostMachineUrl;
    }
}

export class NearLambda implements KurtosisLambda {
    constructor() {}

    async execute(networkCtx: NetworkContext, serializedParams: string): Promise<Result<string, Error>> {
        log.info("Near Lambda receives serializedParams '" + serializedParams + "'");
        let args: ExecuteArgs;
        try {
            args = JSON.parse(serializedParams)
        } catch (e: any) {
            // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
            // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
            if (e && e.stack && e.message) {
                return err(e as Error);
            }
            return err(new Error("Parsing params string '" + serializedParams + "' threw an exception, but " +
                "it's not an Error so we can't report any more information than this"));
        }

        // TODO handle custom params here

        const addWampServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await NearLambda.addWampService(networkCtx)
        if (addWampServiceResult.isErr()) {
            return err(addWampServiceResult.error);
        }
        const [wampServiceCtx, wampHostPortBindings] = addWampServiceResult.value;
        const wampHostMachinePortBindingOpt: PortBinding | undefined = wampHostPortBindings.get(EXPLORER_WAMP_DOCKER_PORT_DESC);

        const addBackendServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await NearLambda.addBackendService(networkCtx)
        if (addBackendServiceResult.isErr()) {
            return err(addBackendServiceResult.error);
        }
        const [backendServiceCtx, backendHostPortBindings] = addBackendServiceResult.value;

        const addFrontendServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await NearLambda.addFrontendService(networkCtx, wampHostMachinePortBindingOpt)
        if (addFrontendServiceResult.isErr()) {
            return err(addFrontendServiceResult.error);
        }
        const [frontendServiceCtx, frontendHostPortBindings] = addFrontendServiceResult.value;
        const frontendHostMachinePortBindingOpt: PortBinding | undefined = frontendHostPortBindings.get(EXPLORER_FRONTEND_DOCKER_PORT_DESC);
        let frontendHostMachineUrl: string | null;
        if (frontendHostMachinePortBindingOpt !== undefined) {
            const frontendHostMachinePortNumResult: Result<number, Error> = NearLambda.getPortNumFromHostMachinePortBinding(frontendHostMachinePortBindingOpt);
            if (frontendHostMachinePortNumResult.isErr()) {
                return err(frontendHostMachinePortNumResult.error);
            }
            const frontendHostMachinePortNum: number = frontendHostMachinePortNumResult.value;
            frontendHostMachineUrl = "http://" + frontendHostMachinePortBindingOpt.getInterfaceIp() + ":" + frontendHostMachinePortNum.toString();
        } else {
            // There was no Docker-external host machine port bound for the frontend, so there's no way we can give a URL to the user that's accessible
            frontendHostMachineUrl = null;
        }


        /*
        //Contract Helper DB
        const contractHelperDBResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addContractHelperDbService(networkCtx);
        if (!contractHelperDBResult.isOk()) {
            return err(contractHelperDBResult.error);
        }
        log.info(CONTRACT_HELPER_DB_SERVICE_ID + "with IP: " + contractHelperDBResult.value[0].getIPAddress() + " and port bindings: " + contractHelperDBResult.value[1]);

        //Bridge
        const bridgeResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addBridgeService(networkCtx);
        if (!bridgeResult.isOk()) {
            return err(bridgeResult.error);
        }
        log.info(BRIDGE_SERVICE_ID + "with IP: " + bridgeResult.value[0].getIPAddress() + " and port bindings: " + bridgeResult.value[1]);

        //Contract Helper App
        const contractHelperAppResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addContractHelperAppService(networkCtx);
        if (!contractHelperAppResult.isOk()) {
            return err(contractHelperAppResult.error);
        }
        log.info(CONTRACT_HELPER_APP_SERVICE_ID + "with IP: " + contractHelperAppResult.value[0].getIPAddress() + " and port bindings: " + contractHelperAppResult.value[1]);

        //Indexer
        const indexerResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addIndexerService(networkCtx);
        if (!indexerResult.isOk()) {
            return err(indexerResult.error);
        }
        log.info(INDEXER_SERVICE_ID + "with IP: " + indexerResult.value[0].getIPAddress() + " and port bindings: " + indexerResult.value[1]);

        //Linkdrop
        const linkdropResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addLikdropService(networkCtx);
        if (!linkdropResult.isOk()) {
            return err(linkdropResult.error);
        }
        log.info(LINKDROP_SERVICE_ID + "with IP: " + linkdropResult.value[0].getIPAddress() + " and port bindings: " + linkdropResult.value[1]);
        
        //Explorer Wamp
        const explorerWampResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addExplorerWampService(networkCtx);
        if (!explorerWampResult.isOk()) {
            return err(explorerWampResult.error);
        }
        log.info(EXPLORER_WAMP_SERVICE_ID + "with IP: " + explorerWampResult.value[0].getIPAddress() + " and port bindings: " + explorerWampResult.value[1]);

        //Explorer Backend
        const explorerBackendResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addExplorerBackendService(networkCtx);
        if (!explorerBackendResult.isOk()) {
            return err(explorerBackendResult.error);
        }
        log.info(EXPLORER_BACKEND_SERVICE_ID + "with IP: " + explorerBackendResult.value[0].getIPAddress() + " and port bindings: " + explorerBackendResult.value[1]);

        //Wallet
        const walletResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addWalletService(networkCtx, contractHelperAppResult.value[1], bridgeResult.value[1]);
        if (!walletResult.isOk()) {
            return err(walletResult.error);
        }
        log.info(WALLET_SERVICE_ID + "with IP: " + walletResult.value[0].getIPAddress() + " and port bindings: " + walletResult.value[1]);

        //Explorer Frontend
        const explorerFrontendResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addExplorerFrontendService(networkCtx, explorerWampResult.value[1], contractHelperAppResult.value[1], walletResult.value[1]);
        if (!explorerFrontendResult.isOk()) {
            return err(explorerFrontendResult.error);
        }
        log.info(EXPLORER_FRONTEND_SERVICE_ID + "with IP: " + explorerFrontendResult.value[0].getIPAddress() + " and port bindings: " + explorerFrontendResult.value[1]);
        
        //Bridge Frontend
        const bridgeFrontendResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addBridgeFrontendService(networkCtx, walletResult.value[1], contractHelperAppResult.value[1]);
        if (!bridgeFrontendResult.isOk()) {
            return err(bridgeFrontendResult.error);
        }
        log.info(BRIDGE_SERVICE_ID + "with IP: " + bridgeFrontendResult.value[0].getIPAddress() + " and port bindings: " + bridgeFrontendResult.value[1]);
        */

        const nearLambdaResult: NearLambdaResult = new NearLambdaResult(frontendHostMachineUrl);

        let stringResult;
        try {
            stringResult = JSON.stringify(nearLambdaResult);
        } catch (e: any) {
            // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
            // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
            if (e && e.stack && e.message) {
                return err(e as Error);
            }
            return err(new Error("An error occurred serializing the Kurtosis Lambda result threw an exception, but " +
                "it's not an Error so we can't report any more information than this"));
        }

        log.info("Near Lambda executed successfully")
        return ok(stringResult);
    }

    // ====================================================================================================
    //                                       Private helper functions
    // ====================================================================================================
    private static async addWampService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const usedPortsSet: Set<string> = new Set();
        usedPortsSet.add(EXPLORER_WAMP_DOCKER_PORT_DESC)
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            EXPLORER_WAMP_IMAGE,
        ).withUsedPorts(
            usedPortsSet,
        ).build();

        const envVars: Map<string, string> = new Map(EXPLORER_WAMP_STATIC_ENVVARS);
        const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                envVars
            ).build();
            return ok(result);
        }
        
        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(EXPLORER_WAMP_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (addServiceResult.isErr()) {
            return err(addServiceResult.error);
        }
        return ok(addServiceResult.value);
    }

    private static async addBackendService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            EXPLORER_BACKEND_IMAGE,
        ).build();

        const envVars: Map<string, string> = new Map(EXPLORER_BACKEND_STATIC_ENVVARS);
        envVars.set(EXPLORER_BACKEND_WAMP_URL_ENVVAR, "ws://" + EXPLORER_WAMP_SERVICE_ID + ":" + EXPLORER_WAMP_PORT_NUM + "/ws");
        // envVars.set(EXPLORER_BACKEND_WAMP_SECRET_ENVVAR, WAMP_BACKEND_SECRET);
        const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                envVars
            ).wthEntrypointOverride(
                EXPLORER_BACKEND_ENTRYPOINT_ARGS
            ).build();
            return ok(result);
        }
        
        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(EXPLORER_BACKEND_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (addServiceResult.isErr()) {
            return err(addServiceResult.error);
        }
        return ok(addServiceResult.value);
    }

    private static async addFrontendService(networkCtx: NetworkContext, wampHostMachinePortBindingOpt?: PortBinding): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const usedPortsSet: Set<string> = new Set();
        usedPortsSet.add(EXPLORER_FRONTEND_DOCKER_PORT_DESC)
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            EXPLORER_FRONTEND_IMAGE,
        ).withUsedPorts(
            usedPortsSet,
        ).build();


        const envVars: Map<string, string> = new Map(EXPLORER_FRONTEND_STATIC_ENVVARS);
        // envVars.set(EXPLORER_FRONTEND_PORT_ENVVAR, EXPLORER_FRONTEND_PORT_NUM.toString());
        // envVars.set(EXPLORER_FRONTEND_NEAR_NETWORKS_ENVVAR, EXPLORER_FRONTEND_NEAR_NETWORKS_VALUE);
        // envVars.set(EXPLORER_FRONTEND_DATA_SOURCE_ENVVAR, "INDEXER_BACKEND");
        envVars.set(EXPLORER_FRONTEND_WAMP_INTERNAL_URL_ENVVAR, "ws://" + EXPLORER_WAMP_SERVICE_ID + ":" + EXPLORER_WAMP_PORT_NUM + "/ws");
        // If there's no host machine WAMP port (i.e. Kurtosis isn't running in debug mode) then we can't set the WAMP Docker-external variable
        if (wampHostMachinePortBindingOpt !== undefined) {
            const wampHostMachinePortNumResult: Result<number, Error> = NearLambda.getPortNumFromHostMachinePortBinding(wampHostMachinePortBindingOpt);
            if (wampHostMachinePortNumResult.isErr()) {
                return err(wampHostMachinePortNumResult.error);
            }
            const wampHostMachinePortNum: number = wampHostMachinePortNumResult.value;
            const wampHostMachineInterfaceIp: string = wampHostMachinePortBindingOpt.getInterfaceIp();
            envVars.set(EXPLORER_FRONTEND_WAMP_EXTERNAL_URL_ENVVAR, "ws://" + wampHostMachineInterfaceIp + ":" + wampHostMachinePortNum.toString() + "/ws");  // This is the WS port on the user's local machine, which we'll only know when we start the WAMP service
        }
        const containerRunConfigSupplier: ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                envVars
            ).build();
            return ok(result);
        }
        
        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(EXPLORER_FRONTEND_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (addServiceResult.isErr()) {
            return err(addServiceResult.error);
        }
        return ok(addServiceResult.value);
    }

    private static getPortNumFromHostMachinePortBinding(binding: PortBinding): Result<number, Error> {
        const portStr: string = binding.getInterfacePort();
        const portStrParts: string[] = portStr.split(DOCKER_PORT_PROTOCOL_SEPARATOR);
        const portNumStr: string = portStrParts[0];
        let portNum: number;
        try {
            portNum = parseInt(portNumStr);
        } catch (e: any) {
            return err(new Error("Couldn't parse host machine port binding number string '" + portNumStr + "' to a number"));
        }
        return ok(portNum);
    }


    /*
    private async addContractHelperDbService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            CONTRACT_HELPER_DB_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(CONTRACT_HELPER_DB_PORT_NUMBER+"/"+CONTRACT_HELPER_DB_PROTOCOL)
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().build();
            return ok(result);
        }
        
        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(CONTRACT_HELPER_DB_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult
    }

    private async addContractHelperAppService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            CONTRACT_HELPER_APP_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(CONTRACT_HELPER_APP_PORT_NUMBER+"/"+CONTRACT_HELPER_APP_PROTOCOL)
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("NODE_URL", "http://" + BRIDGE_SERVICE_ID + ":" + BRIDGE_PORT_NUMBER_01)
                .set("INDEXER_DB_CONNECTION", "postgres://indexer:indexer@" + CONTRACT_HELPER_DB_SERVICE_ID + "/indexer")
                .set("HELPER_DB_USERNAME", "helper")
                .set("HELPER_DB_PASSWORDS", "helper")
                .set("HELPER_DB_NAME", "accounts_development")
                .set("HELPER_DB_HOST", CONTRACT_HELPER_DB_SERVICE_ID)
            ).build()
            return ok(result);
        }

        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(CONTRACT_HELPER_APP_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult

    }

    private async addBridgeService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            BRIDGE_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(BRIDGE_PORT_NUMBER_01+"/"+BRIDGE_PROTOCOL)
            .add(BRIDGE_PORT_NUMBER_02+"/"+BRIDGE_PROTOCOL)
            .add(BRIDGE_PORT_NUMBER_03+"/"+BRIDGE_PROTOCOL)
            .add(BRIDGE_PORT_NUMBER_04+"/"+BRIDGE_PROTOCOL)
            .add(BRIDGE_PORT_NUMBER_05+"/"+BRIDGE_PROTOCOL)
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().build();
            return ok(result);
        }
        
        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(BRIDGE_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult
    }
   
    private async addIndexerService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(INDEXER_IMAGE).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("DATABASE_URL", "postgres://indexer:indexer@" + CONTRACT_HELPER_DB_SERVICE_ID + "/indexer")
            ).wthEntrypointOverride([
                "/bin/sh",
                "-c",
			    "sleep 10 && diesel migration run && ./target/release/indexer-explorer run sync-from-latest",
            ]).build()
            return ok(result);
        }

        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(INDEXER_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult

    }

    private async addWalletService(
            networkCtx: NetworkContext,
            contractHelperAppPortBinding: Map<string, PortBinding>,
            bridgePortBinding: Map<string, PortBinding>): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {

        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            BRIDGE_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(WALLET_PORT_NUMBER+"/"+WALLET_PROTOCOL)
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {

            const contractHelperAppHostPortOptional: string | undefined = contractHelperAppPortBinding.get(CONTRACT_HELPER_APP_PORT_NUMBER + "/" + CONTRACT_HELPER_APP_PROTOCOL)?.getInterfacePort()
            if (contractHelperAppHostPortOptional === undefined) {
                return err(new Error("This is and error in Kurt Core, all services should have defined the PortBinding values"));
            }
            const contractHelperAppHostPort: string = contractHelperAppHostPortOptional!
            
            const bridgeHostPortOptional: string | undefined  = bridgePortBinding.get(BRIDGE_PORT_NUMBER_01 + "/" + BRIDGE_PROTOCOL)?.getInterfacePort()
            if (typeof bridgeHostPortOptional === undefined) {
                return err(new Error("This is and error in Kurt Core, all services should have defined the PortBinding values"));
            }
            const bridgeHostPort: string = bridgeHostPortOptional!

            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("REACT_APP_ACCOUNT_HELPER_URL", "http://localhost:" + contractHelperAppHostPort)
                .set("REACT_APP_ACCOUNT_ID_SUFFIX", "node0")
                .set("REACT_APP_IS_MAINNET", "false")
                .set("REACT_APP_NODE_URL", "http://localhost:" + bridgeHostPort)
                .set("REACT_APP_ACCESS_KEY_FUNDING_AMOUNT", "3000000000000000000000000")
                .set("EXPLORER_URL", "http://localhost:" + "9001") //TODO we should replace this port with the explorerFrontend Host Port
                //TODO we have a circular dependency with Explorer Frontend. We are not able to replace this "http://localhost:9001" with "http://explorerFrontendServiceID:explorerFrontendPort/profile" because it will be executed in the hostmachine's browser
                
            ).build()
            return ok(result);
        }

        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(WALLET_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult

    }

    private async addLikdropService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(LINKDROP_IMAGE).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("NODE_URL", "http://" + BRIDGE_SERVICE_ID + ":" + BRIDGE_PORT_NUMBER_01)
            ).build()
            return ok(result);
        }

        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(LINKDROP_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult

    }

    private async addExplorerWampService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            EXPLORER_WAMP_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(EXPLORER_WAMP_PORT_NUMBER_01+"/"+EXPLORER_WAMP_PROTOCOL)
            .add(EXPLORER_WAMP_PORT_NUMBER_02+"/"+EXPLORER_WAMP_PROTOCOL)
            .add(EXPLORER_WAMP_PORT_NUMBER_03+"/"+EXPLORER_WAMP_PROTOCOL)
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("WAMP_EXPLORER_PORT", EXPLORER_WAMP_PORT_NUMBER_01)
                .set("WAMP_EXPLORER_BACKEND_SECRET", "back")
            ).build()
            return ok(result);
        }

        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(EXPLORER_WAMP_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult

    }

    private async addExplorerBackendService(networkCtx: NetworkContext): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(EXPLORER_BACKEND_IMAGE).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("NEAR_RPC_URL", "http://" + BRIDGE_SERVICE_ID + ":" + BRIDGE_PORT_NUMBER_01)
                .set("NEAR_GENESIS_RECORDS_URL", "http://" + BRIDGE_SERVICE_ID + ":" + BRIDGE_PORT_NUMBER_05 + "/genesis.json")
                .set("WAMP_EXPLORER_URL", "ws://" + EXPLORER_WAMP_SERVICE_ID + ":" + EXPLORER_WAMP_PORT_NUMBER_01  + "/ws")
                .set("WAMP_EXPLORER_BACKEND_SECRET", "back")
            ).wthEntrypointOverride([
                "/bin/sh",
                "-c",
			    "sleep 100000",
            ]).build()
            return ok(result);
        }

        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(EXPLORER_BACKEND_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult
    }

    private async addExplorerFrontendService(networkCtx: NetworkContext, 
            explorerWampPortBinding: Map<string, PortBinding>, 
            contractHelperAppPortBinding: Map<string, PortBinding>,
            walletPortBinding: Map<string, PortBinding>): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        
        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            EXPLORER_FRONTEND_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(EXPLORER_FRONTEND_PORT_NUMBER+"/"+EXPLORER_FRONTEND_PROTOCOL)
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const explorerWampHostPortOptional: string | undefined =  explorerWampPortBinding.get(EXPLORER_WAMP_PORT_NUMBER_01 + "/" + EXPLORER_WAMP_PROTOCOL)?.getInterfacePort()
            if (typeof explorerWampHostPortOptional === undefined) {
                return err(new Error("This is and error in Kurt Core, all services should have defined the PortBinding values"));
            }
            const explorerWampHostPort: string = explorerWampHostPortOptional!
            const contractHelperAppHostPortOptional: string | undefined = contractHelperAppPortBinding.get(CONTRACT_HELPER_DB_PORT_NUMBER + "/" + CONTRACT_HELPER_APP_PROTOCOL)?.getInterfacePort()
            if (typeof contractHelperAppHostPortOptional === undefined) {
                return err(new Error("This is and error in Kurt Core, all services should have defined the PortBinding values"));
            }
            const contractHelperAppHostPort: string = contractHelperAppHostPortOptional!
            const walletHostPortOptional: string | undefined = walletPortBinding.get(WALLET_PORT_NUMBER + "/" + WALLET_PROTOCOL)?.getInterfacePort()
            if (typeof walletHostPortOptional === undefined) {
                return err(new Error("This is and error in Kurt Core, all services should have defined the PortBinding values"));
            }
            const walletHostPort: string = walletHostPortOptional!
            
            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("PORT", EXPLORER_FRONTEND_PORT_NUMBER)
                .set("WAMP_EXPLORER_URL", "ws://localhost:" + explorerWampHostPort + "/ws")
                .set("WAMP_EXPLORER_INTERNAL_URL", "ws://" + EXPLORER_WAMP_SERVICE_ID + ":" + EXPLORER_WAMP_PORT_NUMBER_01 + "/ws")
                .set("NEAR_NETWORKS", "[{\"name\": \"localhostnet\",\"explorerLink\": \"http://localhost:" + contractHelperAppHostPort + "\",\"aliases\": [\"localhost:" + contractHelperAppHostPort + "\", \"localhost\", \"127.0.0.1\", \"127.0.0.1:" + contractHelperAppHostPort  + "\"],\"nearWalletProfilePrefix\": \"http://localhost:" + walletHostPort + "/profile\"}]")
            ).build()
            return ok(result);
        }

        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(EXPLORER_FRONTEND_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult
    }

    private async addBridgeFrontendService(
            networkCtx: NetworkContext,
            walletPortBinding: Map<string, PortBinding>,
            contractHelperAppPortBinding: Map<string, PortBinding>): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>>{
        
        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            BRIDGE_FRONTEND_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(BRIDGE_FRONTEND_PORT_NUMBER + "/" + BRIDGE_FRONTEND_PROTOCOL)
        ).build();    
        
        
        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const environmentVariables: Map<string, string> = new Map();
            const walletHostPortOptional: string | undefined = walletPortBinding.get(WALLET_PORT_NUMBER + "/" + WALLET_PROTOCOL)?.getInterfacePort()
            if (typeof walletHostPortOptional === undefined) {
                return err(new Error("This is and error in Kurt Core, all services should have defined the PortBinding values"));
            }
            const walletHostPort: string = walletHostPortOptional!
            const contractHelperAppHostPortOptional: string | undefined = contractHelperAppPortBinding.get(CONTRACT_HELPER_APP_PORT_NUMBER + "/" + CONTRACT_HELPER_APP_PROTOCOL)?.getInterfacePort()
            if (typeof contractHelperAppHostPortOptional === undefined) {
                return err(new Error("This is and error in Kurt Core, all services should have defined the PortBinding values"));
            }
            const contractHelperAppHostPort: string = contractHelperAppHostPortOptional!

            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("ETH_NODE_URL", BRIDGE_SERVICE_ID + ":" + BRIDGE_PROTOCOL)
                .set("NEAR_WALLET_URL", "http://localhost:" + walletHostPort)
                .set("NEAR_HELPER_URL", "http://localhost:" + contractHelperAppHostPort)
            ).build()
            return ok(result);
        }
        
        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(BRIDGE_FRONTEND_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult

    }
    */

}
