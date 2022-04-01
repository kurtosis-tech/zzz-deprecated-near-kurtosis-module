export class ServiceUrl {
    constructor(
        // E.g. "http"
        public readonly protocol: string,
        public readonly ipAddress: string,
        public readonly portNumber: number,
        // May be emptystring
        public readonly path: string,
    ) {}

    public toString(): string {
        return `${this.protocol}://${this.ipAddress}:${this.portNumber}${this.path}`
    }
}