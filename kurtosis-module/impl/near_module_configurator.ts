import { Result, err, ok } from 'neverthrow';
import * as log from 'loglevel';
import { NearModule } from './near_module';
import { ExecutableKurtosisModule, KurtosisModuleConfigurator } from 'kurtosis-module-api-lib';

const DEFAULT_LOG_LEVEL: string = "info";

type LoglevelAcceptableLevelStrs = log.LogLevelDesc

// Params, serialized to JSON, that the module accepts when it's loaded (analagous to a constructor)
interface LoadModuleParams {
    logLevel: string;
}

export class NearModuleConfigurator implements KurtosisModuleConfigurator {
    public parseParamsAndCreateExecutableModule(serializedCustomParamsStr: string): Result<ExecutableKurtosisModule, Error> {
        let args: LoadModuleParams;
        try {
            args = JSON.parse(serializedCustomParamsStr);
        } catch (e: any) {
            // Sadly, we have to do this because there's no great way to enforce the caught thing being an error
            // See: https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
            if (e && e.stack && e.message) {
                return err(e as Error);
            }
            return err(new Error("Parsing params string '" + serializedCustomParamsStr + "' threw an exception, but " +
                "it's not an Error so we can't report any more information than this"));
        }

        console.log("NEAR module initialization args:");
        console.log(args);

        const setLogLevelResult: Result<null, Error> = NearModuleConfigurator.setLogLevel(args.logLevel)
        if (setLogLevelResult.isErr()) {
            console.log("Error in setting the log level")
            return err(setLogLevelResult.error);
        }

        const module: ExecutableKurtosisModule = new NearModule();
        return ok(module);
    }

    private static setLogLevel(logLevelStr: string): Result<null, Error> {
        let logLevelDescStr: string = logLevelStr;
        if (logLevelStr === null || logLevelStr === undefined || logLevelStr === "") {
            logLevelDescStr = DEFAULT_LOG_LEVEL;
        }
        const logLevelDesc: log.LogLevelDesc = logLevelDescStr as log.LogLevelDesc
        log.setLevel(logLevelDesc);
        return ok(null);
    }
}
