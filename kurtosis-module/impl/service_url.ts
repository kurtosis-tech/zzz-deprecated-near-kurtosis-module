import { Result, err, ok } from "neverthrow";
import { ServiceContext } from "kurtosis-sdk"

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
        return this.toStringWithIpAddressOverride(this.ipAddress);
    }
    
    public toStringWithIpAddressOverride(override: string) {
        return `${this.protocol}://${override}:${this.portNumber}${this.path}`
    }
}

// Returns a tuple of (privateUrl, publicUrl)
export function getPrivateAndPublicUrlsForPortId(
    serviceCtx: ServiceContext, 
    portId: string, 
    // The protocol of the URL, e.g. "http"
    protocol: string,
    // The path that will be appended to the URLs (may be emptystring)
    path: string,
): Result<[ServiceUrl, ServiceUrl], Error> {
    const maybePrivatePortSpec = serviceCtx.getPrivatePorts().get(portId)
    if (maybePrivatePortSpec === undefined) {
        return err(new Error(`Expected service '${serviceCtx.getServiceID()}' to have private port with ID '${portId}' but none was found`));
    }
    const privatePortSpec = maybePrivatePortSpec;
    const privateUrl = new ServiceUrl(
        protocol,
        serviceCtx.getServiceID(),  // Service IDs are also domain names inside the enclave
        privatePortSpec.number,
        path,
    )


    const maybePublicIPAddress = serviceCtx.getMaybePublicIPAddress();
    if (maybePublicIPAddress === undefined) {
        return err(new Error(`Expected service '${serviceCtx.getServiceID()}' to have a public IP address but none was found`));
    }
    const maybePublicPortSpec = serviceCtx.getPublicPorts().get(portId)
    if (maybePublicPortSpec === undefined) {
        return err(new Error(`Expected service '${serviceCtx.getServiceID()}' to have public port with ID '${portId}' but none was found`));
    }
    const publicPortSpec = maybePublicPortSpec;
    const publicUrl = new ServiceUrl(
        protocol,
        maybePublicIPAddress,
        publicPortSpec.number,
        path,
    )

    return ok([privateUrl, publicUrl]);
}