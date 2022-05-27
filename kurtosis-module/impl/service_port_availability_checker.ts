import { Result, ok, err } from "neverthrow";
import * as tcpPortUsed from "tcp-port-used";

export async function waitForPortAvailability(
    privatePortNum: number,
    host: string,
    millisBetweenRetries: number,
    maxTimeoutMillis: number,
): Promise<Result<null, Error>> {
    return tcpPortUsed.waitUntilUsedOnHost(
        privatePortNum,
        host,
        millisBetweenRetries,
        maxTimeoutMillis,
    ).then((): Result<null, Error> => {
        return ok(null)
    }).catch((): Result<null, Error> => {
        return err(new Error(`Private port '${privatePortNum}' didn't become available even after ` +
            `${maxTimeoutMillis}ms with ${millisBetweenRetries}ms between ` +
            `retries`))
    })
}