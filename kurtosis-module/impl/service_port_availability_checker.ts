import { Result, ok, err } from "neverthrow";
import * as tcpPortUsed from "tcp-port-used";

export async function waitForPortAvailability(
    privatePortNum: number,
    host: string,
    millisBetweenRetries: number,
    maxTimeoutMillis: number,
): Promise<Result<null, Error>> {
    return ok(null)
    // TODO The tcp-port-used library seems to work fine on normal machines, but fails on M1 Macs for unknown reasons
    //  We should either figure out why tcp-port-used doesn't work, or pick a new library!
    /*
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
    */
}