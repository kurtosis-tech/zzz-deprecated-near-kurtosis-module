import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import { KurtosisLambda } from "kurtosis-lambda-api-lib";
import { Result, ok, err } from "neverthrow";
import * as log from "loglevel";

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
const EXPLORER_WAMP_PORT_NUMBER_02: string = "8080"
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


interface NearLambdaParams {
}

class NearLambdaResult {
    readonly walletURL: string
    readonly bridgeURL: string
    readonly explorerURL: string

    constructor(walletURL: string, bridgeURL: string, explorerURL: string) {
        this.walletURL = walletURL;
        this.bridgeURL = bridgeURL;
        this.explorerURL = explorerURL;
    }
}

export class NearLambda implements KurtosisLambda {
    constructor() {}

    async execute(networkCtx: NetworkContext, serializedParams: string): Promise<Result<string, Error>> {
        log.info("Near Lambda receives serializedParams '" + serializedParams + "'");
        let params: NearLambdaParams;

        try {
            params = JSON.parse(serializedParams)
        } catch (e: any) {
            // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
            // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
            if (e && e.stack && e.message) {
                return err(e as Error);
            }
            return err(new Error("Parsing params string '" + serializedParams + "' threw an exception, but " +
                "it's not an Error so we can't report any more information than this"));
        }

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
        /*const linkdropResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addLikdropService(networkCtx);
        if (!linkdropResult.isOk()) {
            return err(linkdropResult.error);
        }
        log.info(LINKDROP_SERVICE_ID + "with IP: " + linkdropResult.value[0].getIPAddress() + " and port bindings: " + linkdropResult.value[1]);
        */

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

        //Explorer Frontend
        const explorerFrontendResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addExplorerFrontendService(networkCtx, explorerWampResult.value[1], contractHelperAppResult.value[1]);
        if (!explorerFrontendResult.isOk()) {
            return err(explorerFrontendResult.error);
        }
        log.info(EXPLORER_FRONTEND_SERVICE_ID + "with IP: " + explorerFrontendResult.value[0].getIPAddress() + " and port bindings: " + explorerFrontendResult.value[1]);

        //Wallet
        const walletResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addWalletService(networkCtx, contractHelperAppResult.value[1], bridgeResult.value[1], explorerFrontendResult.value[1]);
        if (!walletResult.isOk()) {
            return err(walletResult.error);
        }
        log.info(WALLET_SERVICE_ID + "with IP: " + walletResult.value[0].getIPAddress() + " and port bindings: " + walletResult.value[1]);

        //Bridge Frontend
        const bridgeFrontendResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addBridgeFrontendService(networkCtx, walletResult.value[1], contractHelperAppResult.value[1]);
        if (!bridgeFrontendResult.isOk()) {
            return err(bridgeFrontendResult.error);
        }
        log.info(BRIDGE_SERVICE_ID + "with IP: " + bridgeFrontendResult.value[0].getIPAddress() + " and port bindings: " + bridgeFrontendResult.value[1]);

        const nearLambdaResult: NearLambdaResult = new NearLambdaResult(
            "http://localhost:"+ walletResult.value[1].get(WALLET_PORT_NUMBER + "/" + WALLET_PROTOCOL),
            "http://localhost:"+ bridgeResult.value[1].get(BRIDGE_PORT_NUMBER_01 + "/" + BRIDGE_PROTOCOL),
            "http://localhost:"+ explorerFrontendResult.value[1].get(EXPLORER_FRONTEND_PORT_NUMBER + "/" + EXPLORER_FRONTEND_PROTOCOL)
        );

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
            bridgePortBinding: Map<string, PortBinding>,
            explorerFrontendPortBinding: Map<string, PortBinding>): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {

        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            BRIDGE_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(WALLET_PORT_NUMBER+"/"+WALLET_PROTOCOL)
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const contractHelperAppHostPort: string = contractHelperAppPortBinding.get(CONTRACT_HELPER_APP_PORT_NUMBER + "/" + CONTRACT_HELPER_APP_PROTOCOL)
            const bridgeHostPort: string = bridgePortBinding.get(BRIDGE_PORT_NUMBER_01 + "/" + BRIDGE_PROTOCOL)
            const explorerFrontendHostPort: string = explorerFrontendPortBinding.get(EXPLORER_FRONTEND_PORT_NUMBER + "/" + EXPLORER_FRONTEND_PROTOCOL)

            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("REACT_APP_ACCOUNT_HELPER_URL", "http://localhost:" + contractHelperAppHostPort)
                .set("REACT_APP_ACCOUNT_ID_SUFFIX", "node0")
                .set("REACT_APP_IS_MAINNET", "false")
                .set("REACT_APP_NODE_URL", "http://localhost:" + bridgeHostPort)
                .set("REACT_APP_ACCESS_KEY_FUNDING_AMOUNT", "3000000000000000000000000")
                .set("EXPLORER_URL", "http://localhost:" + explorerFrontendHostPort)
                
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
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("WAMP_NEAR_EXPLORER_PORT", EXPLORER_WAMP_PORT_NUMBER_01)
                .set("WAMP_NEAR_EXPLORER_BACKEND_SECRET", "back")
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
                .set("WAMP_NEAR_EXPLORER_URL", "ws://" + EXPLORER_WAMP_SERVICE_ID + ":" + EXPLORER_WAMP_PORT_NUMBER_01  + "/ws")
                .set("WAMP_NEAR_EXPLORER_BACKEND_SECRET", "back")
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
            contractHelperAppPortBinding: Map<string, PortBinding>): Promise<Result<[ServiceContext, Map<string, PortBinding>], Error>> {
        
        const usedPortsSet: Set<string> = new Set();
        const containerCreationConfig: ContainerCreationConfig = new ContainerCreationConfigBuilder(
            EXPLORER_FRONTEND_IMAGE,
        ).withUsedPorts(
            usedPortsSet.add(EXPLORER_FRONTEND_PORT_NUMBER+"/"+EXPLORER_FRONTEND_PROTOCOL)
        ).build();

        const containerRunConfigSupplier: (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error> = 
        (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => {
            const explorerWampHostPort : string =  explorerWampPortBinding.get(EXPLORER_WAMP_PORT_NUMBER_01 + "/" + EXPLORER_WAMP_PROTOCOL)
            const contractHelperAppHostPort: string = contractHelperAppPortBinding.get(CONTRACT_HELPER_DB_PORT_NUMBER + "/" + CONTRACT_HELPER_APP_PROTOCOL) 
            
            const environmentVariables: Map<string, string> = new Map();
            const result: ContainerRunConfig = new ContainerRunConfigBuilder().withEnvironmentVariableOverrides(
                environmentVariables.set("PORT", EXPLORER_FRONTEND_PORT_NUMBER)
                .set("WAMP_NEAR_EXPLORER_URL", "ws://localhost:" + explorerWampHostPort + "/ws")
                .set("WAMP_NEAR_EXPLORER_INTERNAL_URL", "ws://" + EXPLORER_WAMP_SERVICE_ID + ":" + EXPLORER_WAMP_PORT_NUMBER_01 + "/ws") //TODO we have a circular dependency with wallet. We are not able to replace this "http://localhost:1234/profile" with "http://walletServiceID:walletPort/profile" because it will be executed in the hostmachine's browser
                .set("NEAR_NETWORKS", "[{\"name\": \"localhostnet\",\"explorerLink\": \"http://localhost:" + contractHelperAppHostPort + "\",\"aliases\": [\"localhost:" + contractHelperAppHostPort + "\", \"localhost\", \"127.0.0.1\", \"127.0.0.1:" + contractHelperAppHostPort  + "\"],\"nearWalletProfilePrefix\": \"http://localhost:1234/profile\"}]")
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
            const walletHostPort: string = walletPortBinding.get(WALLET_PORT_NUMBER + "/" + WALLET_PROTOCOL)
            const contractHelperAppHostPort: string = contractHelperAppPortBinding.get(CONTRACT_HELPER_APP_PORT_NUMBER + "/" + CONTRACT_HELPER_APP_PROTOCOL)
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

}
