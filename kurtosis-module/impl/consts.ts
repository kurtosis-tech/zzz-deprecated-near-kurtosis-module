import { PortSpec } from "kurtosis-core-api-lib";

export const EXEC_COMMAND_SUCCESS_EXIT_CODE: number = 0;

// IF a host machine port binding is available, call the urlSupplier function to form a URL out of the port binding IP & port
// If no host machine port binding is available, return null
export function tryToFormHostMachineUrl(
        maybePublicIpAddr: string,
        maybePublicPort: PortSpec | undefined,
        urlSupplier: (ipAddr: string, portNum: number) => string
): string | undefined {
    let result: string | undefined = undefined;
    if (maybePublicPort === undefined || maybePublicIpAddr.length === 0) {
        return undefined;
    }
    const publicPortNum = maybePublicPort.number;
    result = urlSupplier(maybePublicIpAddr, publicPortNum);
    return result;
}