import { getDefaultExecuteParams } from "./default_params";
import { ExecuteParams } from "./params";
import { Result, ok, err } from "neverthrow";

export function deserializeAndValidateParams(paramsStr: string): Result<ExecuteParams, Error> {
    let deserializedObj: any;
    try {
        deserializedObj = JSON.parse(paramsStr)
    } catch (e: any) {
        if (e && e.stack && e.message) {
            return err(e as Error)
        }
        return err(new Error(`JSON-parsing string '${paramsStr}' threw something that wasn't an error:${e}`))
    }

    const defaultParams = getDefaultExecuteParams()
    const result: ExecuteParams = Object.assign(defaultParams, deserializedObj)

    if (result.backendIpAddress.trim() === "") {
        return err(new Error("Backend IP address cannot be empty"));
    }

    return ok(result);
}