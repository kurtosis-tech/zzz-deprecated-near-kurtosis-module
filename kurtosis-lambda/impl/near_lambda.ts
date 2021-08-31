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
const EXPLORER_WAMP_PORT_NUMBER: string = "9090"
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

        const addContractHelperDBResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await this.addContractHelperDbService(networkCtx);
        if (!addContractHelperDBResult.isOk()) {
            return err(addContractHelperDBResult.error);
        }
        log.info("addContractHelperDBResult value:" + addContractHelperDBResult.value)

        const nearLambdaResult: NearLambdaResult = new NearLambdaResult(
           "testing",
           "testing2",
           "testing3"
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
        
        const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(CONTRACT_HELPER_DB_SERVICE_ID, containerCreationConfig, containerRunConfigSupplier);
        if (!addServiceResult.isOk()) {
            return err(addServiceResult.error);
        }

        return addServiceResult
    }

}
