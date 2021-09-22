import { NetworkContext, ServiceID, ContainerCreationConfig, ContainerCreationConfigBuilder, ContainerRunConfig, ContainerRunConfigBuilder, StaticFileID, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import { KurtosisLambda } from "kurtosis-lambda-api-lib";
import { Result, ok, err } from "neverthrow";
import * as log from "loglevel";
import { addContractHelperDb, ContractHelperDbInfo } from "./services/contract_helper_db";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, getPortNumFromHostMachinePortBinding, TCP_PROTOCOL, tryToFormHostMachineUrl } from "./consts";
import { addNearupService, NearupInfo } from "./services/nearup";
import { addContractHelperService, ContractHelperServiceInfo } from "./services/contract_helper";
import { addWallet, WalletInfo } from "./services/wallet";
import { addIndexer, IndexerInfo } from "./services/indexer";
import { addExplorerWampService, ExplorerWampInfo } from "./services/explorer_wamp";
import { addExplorerBackendService } from "./services/explorer_backend";
import { addExplorerFrontendService, ExplorerFrontendInfo } from "./services/explorer_frontend";


export type ContainerRunConfigSupplier = (ipAddr: string, generatedFileFilepaths: Map<string, string>, staticFileFilepaths: Map<StaticFileID, string>) => Result<ContainerRunConfig, Error>;

const EXPLORER_WAMP_BACKEND_SHARED_SECRET: string = "back";



// Explorer Frontend

class NearLambdaResult {
    // When Kurtosis is in debug mode, the explorer frontend's port will be bound to a port on the user's machine so they can access the frontend
    //  even though the frontend is running inside Docker. When Kurtosis is not in debug mode, this will be null.

    // Same thing - when debug mode is enabled, the nearup container will be bound to a port on the user's host machine
    private readonly maybeHostMachineNearNodeUrl: string | null;

    private readonly maybeHostMachineContractHelperUrl: string | null;

    private readonly maybeHostMachineWalletUrl: string | null;

    private readonly maybeHostMachineExplorerFrontendUrl: string | null;

    constructor(
        maybeHostMachineNearNodeUrl: string | null,
        maybeHostMachineContractHelperUrl: string | null,
        maybeHostMachineWalletUrl: string | null,
        maybeHostMachineExplorerFrontendUrl: string | null,
    ) {
        this.maybeHostMachineNearNodeUrl = maybeHostMachineNearNodeUrl;
        this.maybeHostMachineContractHelperUrl = maybeHostMachineContractHelperUrl;
        this.maybeHostMachineWalletUrl = maybeHostMachineWalletUrl;
        this.maybeHostMachineExplorerFrontendUrl = maybeHostMachineExplorerFrontendUrl;
    }
}

export class NearLambda implements KurtosisLambda {
    constructor() {}

    // All this logic comes from translating https://github.com/near/docs/blob/975642ad49338bf8728a675def1f8bec8a780922/docs/local-setup/entire-setup.md
    //  into Kurtosis-compatible code
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
        const addContractHelperDbServiceResult: Result<ContractHelperDbInfo, Error> = await addContractHelperDb(networkCtx)
        if (addContractHelperDbServiceResult.isErr()) {
            return err(addContractHelperDbServiceResult.error);
        }
        const contractHelperDbInfo: ContractHelperDbInfo = addContractHelperDbServiceResult.value;

        const addIndexerResult: Result<IndexerInfo, Error> = await addIndexer(
            networkCtx,
            contractHelperDbInfo.getNetworkInternalHostname(),
            contractHelperDbInfo.getNetworkInternalPortNum(),
            contractHelperDbInfo.getDbUsername(),
            contractHelperDbInfo.getDbPassword(),
            contractHelperDbInfo.getIndexerDb()
        );
        if (addIndexerResult.isErr()) {
            return err(addIndexerResult.error);
        }
        const indexerInfo: IndexerInfo = addIndexerResult.value;

        /*
        const addNearupServiceResult: Result<NearupInfo, Error> = await addNearupService(networkCtx)
        if (addNearupServiceResult.isErr()) {
            return err(addNearupServiceResult.error);
        }
        const nearupInfo: NearupInfo = addNearupServiceResult.value;
        */

        const addContractHelperServiceResult: Result<ContractHelperServiceInfo, Error> = await addContractHelperService(
            networkCtx,
            contractHelperDbInfo.getNetworkInternalHostname(),
            contractHelperDbInfo.getNetworkInternalPortNum(),
            contractHelperDbInfo.getDbUsername(),
            contractHelperDbInfo.getDbPassword(),
            contractHelperDbInfo.getIndexerDb(),
            indexerInfo.getNetworkInternalHostname(),
            indexerInfo.getNetworkInternalPortNum(),
            indexerInfo.getValidatorKey()
        );
        if (addContractHelperServiceResult.isErr()) {
            return err(addContractHelperServiceResult.error);
        }
        const contractHelperServiceInfo: ContractHelperServiceInfo = addContractHelperServiceResult.value;

        const addExplorerWampResult: Result<ExplorerWampInfo, Error> = await addExplorerWampService(
            networkCtx,
            EXPLORER_WAMP_BACKEND_SHARED_SECRET
        );
        if (addExplorerWampResult.isErr()) {
            return err(addExplorerWampResult.error);
        }
        const explorerWampInfo: ExplorerWampInfo = addExplorerWampResult.value;

        const addExplorerBackendResult: Result<null, Error> = await addExplorerBackendService(
            networkCtx,
            explorerWampInfo.getInternalUrl(),
            EXPLORER_WAMP_BACKEND_SHARED_SECRET,
        );
        if (addExplorerBackendResult.isErr()) {
            return err(addExplorerBackendResult.error);
        }

        const addExplorerFrontendResult: Result<ExplorerFrontendInfo, Error> = await addExplorerFrontendService(
            networkCtx,
            explorerWampInfo.getInternalUrl(),
            explorerWampInfo.getMaybeHostMachineUrl()
        );
        if (addExplorerFrontendResult.isErr()) {
            return err(addExplorerFrontendResult.error);
        }
        const explorerFrontendInfo: ExplorerFrontendInfo = addExplorerFrontendResult.value;

        // TODO Uncomment when wallet is configurable at runtime
        /*
        const addWalletResult: Result<WalletInfo, Error> = await addWallet(
            networkCtx,
            indexerInfo.getMaybeHostMachineUrl(),
            contractHelperServiceInfo.getMaybeHostMachineUrl(),
            undefined, // TODO TODO TODO FIX THIS!!!
        );
        if (addWalletResult.isErr()) {
            return err(addWalletResult.error);
        }
        const walletInfo: WalletInfo = addWalletResult.value;
        */

        const nearLambdaResult: NearLambdaResult = new NearLambdaResult(
            indexerInfo.getMaybeHostMachineUrl() || null,
            contractHelperServiceInfo.getMaybeHostMachineUrl() || null,
            // walletInfo.getMaybeHostMachineUrl() || null,
            null, // TODO REPLACE WITH ACTUAL WALLET HOST MACHINE URL
            explorerFrontendInfo.getMaybeHostMachineUrl() || null,
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







}