import { PortSpec } from "kurtosis-core-api-lib";
import { ServiceUrl } from "./service_url";

export const EXEC_COMMAND_SUCCESS_EXIT_CODE: number = 0;

// IF a host machine port binding is available, call the urlSupplier function to form a URL out of the port binding IP & port
// If no host machine port binding is available, return undefined
export function tryToFormHostMachineUrl(
        protocol: string,
        maybePublicIpAddr: string,
        maybePublicPort: PortSpec | undefined,
        // May be emptystring
        path: string,
): ServiceUrl | undefined {
    let result: string | undefined = undefined;
    if (maybePublicPort === undefined || maybePublicIpAddr.length === 0) {
        return undefined;
    }
    const publicPortNum = maybePublicPort.number;
    return new ServiceUrl(protocol, maybePublicIpAddr, publicPortNum, path);
}