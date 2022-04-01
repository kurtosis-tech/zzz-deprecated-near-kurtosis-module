export class ExecuteParams {
    constructor(
        // The IP address of the machine running Kurtosis, which will be slotted into the Wallet & Explorer
        //  frontends so they can pull information
        public readonly backendIpAddress: string,
    ) {}
}