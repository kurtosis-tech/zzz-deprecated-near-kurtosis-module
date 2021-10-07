import { PortBinding } from "kurtosis-core-api-lib";
import { Result, ok, err } from "neverthrow";

export const TCP_PROTOCOL: string = "tcp";
export const DOCKER_PORT_PROTOCOL_SEPARATOR: string = "/";
export const EXEC_COMMAND_SUCCESS_EXIT_CODE: number = 0;


export interface NearKey {
    account_id: string;
    public_key: string;
    secret_key: string;
}

export function getPortNumFromHostMachinePortBinding(binding: PortBinding): Result<number, Error> {
    const portStr: string = binding.getInterfacePort();
    const portStrParts: string[] = portStr.split(DOCKER_PORT_PROTOCOL_SEPARATOR);
    const portNumStr: string = portStrParts[0];
    let portNum: number;
    try {
        portNum = parseInt(portNumStr);
    } catch (e: any) {
        return err(new Error("Couldn't parse host machine port binding number string '" + portNumStr + "' to a number"));
    }
    return ok(portNum);
}

// IF a host machine port binding is available, call the urlSupplier function to form a URL out of the port binding IP & port
// If no host machine port binding is available, return null
export function tryToFormHostMachineUrl(
        maybeHostMachinePortBinding: PortBinding | undefined,
        urlSupplier: (ipAddr: string, portNum: number) => string
): Result<string | undefined, Error> {
    let result: string | undefined = undefined;
    if (maybeHostMachinePortBinding !== undefined) {
        const hostMachinePortBinding: PortBinding = maybeHostMachinePortBinding!;
        const hostMachineIpAddr: string = hostMachinePortBinding.getInterfaceIp();
        const hostMachinePortNumResult: Result<number, Error> = getPortNumFromHostMachinePortBinding(hostMachinePortBinding);
        if (hostMachinePortNumResult.isErr()) {
            return err(hostMachinePortNumResult.error);
        }
        const hostMachinePortNum: number = hostMachinePortNumResult.value;
        result = urlSupplier(hostMachineIpAddr, hostMachinePortNum);
    }
    return ok(result);
}