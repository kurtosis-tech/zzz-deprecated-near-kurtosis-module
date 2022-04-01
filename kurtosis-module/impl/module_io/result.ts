// Result returned by the execute command, serialized as JSON
export class ExecuteResult {
    private readonly networkName: string;

    private readonly rootValidatorKey: Object;

    private readonly nearNodeRpcUrl: string | null;

    private readonly contractHelperServiceUrl: string | null;

    private readonly walletUrl: string | null;

    private readonly explorerUrl: string | null;

    constructor(
        networkName: string,
        rootValidatorKey: Object,
        nearNodeRpcUrl: string | null,
        contractHelperServiceUrl: string | null,
        walletUrl: string | null,
        explorerUrl: string | null,
    ) {
        this.networkName = networkName;
        this.rootValidatorKey = rootValidatorKey;
        this.nearNodeRpcUrl = nearNodeRpcUrl;
        this.contractHelperServiceUrl = contractHelperServiceUrl;
        this.walletUrl = walletUrl;
        this.explorerUrl = explorerUrl;
    }
}