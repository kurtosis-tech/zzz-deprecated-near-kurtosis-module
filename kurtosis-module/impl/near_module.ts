import { NetworkContext, SharedPath, ContainerConfig } from "kurtosis-core-api-lib";
import { Result, ok, err } from "neverthrow";
import * as log from "loglevel";
import { addContractHelperDb, ContractHelperDbInfo } from "./services/contract_helper_db";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, getPortNumFromHostMachinePortBinding, TCP_PROTOCOL, tryToFormHostMachineUrl } from "./consts";
// import { addNearupService, NearupInfo } from "./services/nearup";
import { addContractHelperService, ContractHelperServiceInfo } from "./services/contract_helper";
import { addIndexer, IndexerInfo } from "./services/indexer";
import { addExplorerWampService, ExplorerWampInfo } from "./services/explorer_wamp";
import { addExplorerBackendService } from "./services/explorer_backend";
import { addExplorerFrontendService, ExplorerFrontendInfo } from "./services/explorer_frontend";
import { addWallet, WalletInfo } from "./services/wallet";
import { ExecutableKurtosisModule } from "kurtosis-module-api-lib";

export type ContainerConfigSupplier = (ipAddr: string, sharedDirpath: SharedPath) => Result<ContainerConfig, Error>;

const EXPLORER_WAMP_BACKEND_SHARED_SECRET: string = "back";

const EXPLORER_WAMP_BACKEND_FRONTEND_SHARED_NETWORK_NAME: string = "localnet";

// Wallet takes a long time to start due to 
const DEFAULT_IS_WALLET_ENABLED_VALUE: boolean = false;

// Params passed in to the execute command, serialized as JSON
class ExecuteParams {
    public isWalletEnabled: boolean = DEFAULT_IS_WALLET_ENABLED_VALUE;
}

// Result returned by the execute command, serialized as JSON
class ExecuteResult {
    // When Kurtosis is in debug mode, the explorer frontend's port will be bound to a port on the user's machine so they can access the frontend
    //  even though the frontend is running inside Docker. When Kurtosis is not in debug mode, this will be null.

    // Same thing - when debug mode is enabled, the nearup container will be bound to a port on the user's host machine
    private readonly maybeHostMachineNearNodeUrl: string | null;

    private readonly maybeHostMachineContractHelperUrl: string | null;

    private readonly maybeHostMachineExplorerWampUrl: string | null;

    private readonly maybeHostMachineWalletUrl: string | null;

    private readonly maybeHostMachineExplorerFrontendUrl: string | null;

    constructor(
        maybeHostMachineNearNodeUrl: string | null,
        maybeHostMachineContractHelperUrl: string | null,
        maybeHostMachineExplorerWampUrl: string | null,
        maybeHostMachineWalletUrl: string | null,
        maybeHostMachineExplorerFrontendUrl: string | null,
    ) {
        this.maybeHostMachineNearNodeUrl = maybeHostMachineNearNodeUrl;
        this.maybeHostMachineContractHelperUrl = maybeHostMachineContractHelperUrl;
        this.maybeHostMachineExplorerWampUrl = maybeHostMachineExplorerWampUrl;
        this.maybeHostMachineWalletUrl = maybeHostMachineWalletUrl;
        this.maybeHostMachineExplorerFrontendUrl = maybeHostMachineExplorerFrontendUrl;
    }
}

export class NearModule implements ExecutableKurtosisModule {
    constructor() {}

    // All this logic comes from translating https://github.com/near/docs/blob/975642ad49338bf8728a675def1f8bec8a780922/docs/local-setup/entire-setup.md
    //  into Kurtosis-compatible code
    async execute(networkCtx: NetworkContext, serializedParams: string): Promise<Result<string, Error>> {
        log.info("Serialized execute params '" + serializedParams + "'");
        let parseResult: any;
        try {
            parseResult = JSON.parse(serializedParams)
        } catch (e: any) {
            // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
            // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
            if (e && e.stack && e.message) {
                return err(e as Error);
            }
            return err(new Error("Parsing params string '" + serializedParams + "' threw an exception, but " +
                "it's not an Error so we can't report any more information than this"));
        }
        const args: ExecuteParams = Object.assign(
            new ExecuteParams(), 
            JSON.parse(serializedParams),
        );

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
            indexerInfo.getNetworkInternalHostname(),
            indexerInfo.getNetworkInternalPortNum(),
            contractHelperDbInfo.getDbUsername(),
            contractHelperDbInfo.getDbPassword(),
            contractHelperDbInfo.getNetworkInternalHostname(),
            contractHelperDbInfo.getIndexerDb(),
            explorerWampInfo.getInternalUrl(),
            EXPLORER_WAMP_BACKEND_SHARED_SECRET,
            EXPLORER_WAMP_BACKEND_FRONTEND_SHARED_NETWORK_NAME,
        );
        if (addExplorerBackendResult.isErr()) {
            return err(addExplorerBackendResult.error);
        }

        const addExplorerFrontendResult: Result<ExplorerFrontendInfo, Error> = await addExplorerFrontendService(
            networkCtx,
            explorerWampInfo.getInternalUrl(),
            explorerWampInfo.getMaybeHostMachineUrl(),
            EXPLORER_WAMP_BACKEND_FRONTEND_SHARED_NETWORK_NAME,
        );
        if (addExplorerFrontendResult.isErr()) {
            return err(addExplorerFrontendResult.error);
        }
        const explorerFrontendInfo: ExplorerFrontendInfo = addExplorerFrontendResult.value;

        let maybeWalletHostMachineUrl: string | undefined = undefined;
        if (args.isWalletEnabled) {
            const addWalletResult: Result<WalletInfo, Error> = await addWallet(
                networkCtx,
                indexerInfo.getMaybeHostMachineUrl(),
                contractHelperServiceInfo.getMaybeHostMachineUrl(),
                explorerFrontendInfo.getMaybeHostMachineUrl(),
            );
            if (addWalletResult.isErr()) {
                return err(addWalletResult.error);
            }
            const walletInfo: WalletInfo = addWalletResult.value;
            maybeWalletHostMachineUrl = walletInfo.getMaybeHostMachineUrl();
        }

        const resultObj: ExecuteResult = new ExecuteResult(
            indexerInfo.getMaybeHostMachineUrl() || null,
            contractHelperServiceInfo.getMaybeHostMachineUrl() || null,
            explorerWampInfo.getMaybeHostMachineUrl() || null,
            maybeWalletHostMachineUrl || null,
            explorerFrontendInfo.getMaybeHostMachineUrl() || null,
        );

        let stringResult;
        try {
            stringResult = JSON.stringify(resultObj);
        } catch (e: any) {
            // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
            // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
            if (e && e.stack && e.message) {
                return err(e as Error);
            }
            return err(new Error("Serializing the module result threw an exception, but " +
                "it's not an Error so we can't report any more information than this"));
        }

        log.info("Near module executed successfully")
        return ok(stringResult);
    }

    // ====================================================================================================
    //                                       Private helper functions
    // ====================================================================================================







}