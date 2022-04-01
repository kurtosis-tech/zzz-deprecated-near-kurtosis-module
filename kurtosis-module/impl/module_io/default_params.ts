import { ExecuteParams } from "./params"

const DEFAULT_BACKEND_IP_ADDRESS: string = "127.0.0.1"

export function getDefaultExecuteParams(): ExecuteParams {
    return new ExecuteParams(DEFAULT_BACKEND_IP_ADDRESS);
}