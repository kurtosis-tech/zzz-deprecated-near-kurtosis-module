export class ExecuteParams {
    constructor(
        // The backend IP address that the Wallet & Explorer websites will connect to
        //  to pull information
        public readonly backendIpAddress: string,
    ) {}
}