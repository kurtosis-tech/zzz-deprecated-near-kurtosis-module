// Result returned by the execute command, serialized as JSON
export class ExecuteResult {
    constructor(
        public readonly networkName: string,
        public readonly rootValidatorKey: Object,
        public readonly nearNodeRpcUrl: string,
        public readonly contractHelperServiceUrl: string,
        public readonly walletUrl: string,
        public readonly explorerUrl: string,
    ) {}
}