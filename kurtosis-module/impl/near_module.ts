import { EnclaveContext, ContainerConfig } from "kurtosis-core-api-lib";
import { Result, ok, err } from "neverthrow";
import * as log from "loglevel";
import { addContractHelperDb, ContractHelperDbInfo } from "./services/contract_helper_db";
import { addContractHelperService, ContractHelperServiceInfo } from "./services/contract_helper";
import { addIndexer, IndexerInfo } from "./services/indexer";
import { addExplorerWampService, ExplorerWampInfo } from "./services/explorer_wamp";
import { addExplorerBackendService } from "./services/explorer_backend";
import { addExplorerFrontendService, ExplorerFrontendInfo } from "./services/explorer_frontend";
import { addWallet, WalletInfo } from "./services/wallet";
import { ExecutableKurtosisModule } from "kurtosis-module-api-lib";
import { deserializeAndValidateParams } from "./module_io/params_deserializer";
import { ExecuteResult } from "./module_io/result";

export type ContainerConfigSupplier = (ipAddr: string) => Result<ContainerConfig, Error>;

const EXPLORER_WAMP_BACKEND_SHARED_SECRET: string = "back";

const EXPLORER_WAMP_BACKEND_FRONTEND_SHARED_NETWORK_NAME: string = "localnet";

const RESULT_JSON_PRETTY_PRINT_SPACE_NUM: number = 4;


export class NearModule implements ExecutableKurtosisModule {
    constructor() {}

    // All this logic comes from translating https://github.com/near/docs/blob/975642ad49338bf8728a675def1f8bec8a780922/docs/local-setup/entire-setup.md
    //  into Kurtosis-compatible code
    async execute(enclaveCtx: EnclaveContext, serializedParams: string): Promise<Result<string, Error>> {
        log.info(`Deserializing the following params string:\n${serializedParams}`);
        const paramDeserializationResult = deserializeAndValidateParams(serializedParams)
        if (paramDeserializationResult.isErr()) {
            return err(paramDeserializationResult.error);
        }
        const executeParams = paramDeserializationResult.value;
        log.info(`Deserialized the params string into the following params object: ${JSON.stringify(executeParams)}`);

        const addContractHelperDbServiceResult: Result<ContractHelperDbInfo, Error> = await addContractHelperDb(enclaveCtx)
        if (addContractHelperDbServiceResult.isErr()) {
            return err(addContractHelperDbServiceResult.error);
        }
        const contractHelperDbInfo: ContractHelperDbInfo = addContractHelperDbServiceResult.value;

        const addIndexerResult: Result<IndexerInfo, Error> = await addIndexer(
            enclaveCtx,
            contractHelperDbInfo.privateUrl,
            contractHelperDbInfo.dbUsername,
            contractHelperDbInfo.dbUserPassword,
            contractHelperDbInfo.indexerDb,
        );
        if (addIndexerResult.isErr()) {
            return err(addIndexerResult.error);
        }
        const indexerInfo: IndexerInfo = addIndexerResult.value;

        const addContractHelperServiceResult: Result<ContractHelperServiceInfo, Error> = await addContractHelperService(
            enclaveCtx,
            contractHelperDbInfo.privateUrl,
            contractHelperDbInfo.dbUsername,
            contractHelperDbInfo.dbUserPassword,
            contractHelperDbInfo.indexerDb,
            indexerInfo.privateRpcUrl,
            indexerInfo.validatorKey,
        );
        if (addContractHelperServiceResult.isErr()) {
            return err(addContractHelperServiceResult.error);
        }
        const contractHelperServiceInfo: ContractHelperServiceInfo = addContractHelperServiceResult.value;

        const addExplorerWampResult: Result<ExplorerWampInfo, Error> = await addExplorerWampService(
            enclaveCtx,
            EXPLORER_WAMP_BACKEND_SHARED_SECRET
        );
        if (addExplorerWampResult.isErr()) {
            return err(addExplorerWampResult.error);
        }
        const explorerWampInfo: ExplorerWampInfo = addExplorerWampResult.value;

        const addExplorerBackendResult: Result<null, Error> = await addExplorerBackendService(
            enclaveCtx,
            indexerInfo.privateRpcUrl,
            contractHelperDbInfo.privateUrl,
            contractHelperDbInfo.dbUsername,
            contractHelperDbInfo.dbUserPassword,
            contractHelperDbInfo.indexerDb,
            contractHelperDbInfo.analyticsDb,
            contractHelperDbInfo.telemetryDb,
            explorerWampInfo.privateUrl,
            EXPLORER_WAMP_BACKEND_SHARED_SECRET,
            EXPLORER_WAMP_BACKEND_FRONTEND_SHARED_NETWORK_NAME,
        );
        if (addExplorerBackendResult.isErr()) {
            return err(addExplorerBackendResult.error);
        }

        const addExplorerFrontendResult: Result<ExplorerFrontendInfo, Error> = await addExplorerFrontendService(
            enclaveCtx,
            executeParams.backendIpAddress,
            explorerWampInfo.privateUrl,
            explorerWampInfo.publicUrl,
            EXPLORER_WAMP_BACKEND_FRONTEND_SHARED_NETWORK_NAME,
        );
        if (addExplorerFrontendResult.isErr()) {
            return err(addExplorerFrontendResult.error);
        }
        const explorerFrontendInfo: ExplorerFrontendInfo = addExplorerFrontendResult.value;

        const addWalletResult: Result<WalletInfo, Error> = await addWallet(
            enclaveCtx,
            executeParams.backendIpAddress,
            indexerInfo.publicRpcUrl,
            contractHelperServiceInfo.publicUrl,
            explorerFrontendInfo.publicUrl,
        );
        if (addWalletResult.isErr()) {
            return err(addWalletResult.error);
        }
        const walletInfo: WalletInfo = addWalletResult.value;

        const resultObj: ExecuteResult = new ExecuteResult(
            EXPLORER_WAMP_BACKEND_FRONTEND_SHARED_NETWORK_NAME,
            indexerInfo.validatorKey,
            indexerInfo.publicRpcUrl.toString(),
            contractHelperServiceInfo.publicUrl.toString(),
            walletInfo.publicUrl.toString(),
            explorerFrontendInfo.publicUrl.toString(),
        );

        let stringResult;
        try {
            stringResult = JSON.stringify(resultObj, null, RESULT_JSON_PRETTY_PRINT_SPACE_NUM);
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