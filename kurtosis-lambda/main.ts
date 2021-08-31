import { KurtosisLambdaConfigurator, KurtosisLambdaExecutor } from "kurtosis-lambda-api-lib";
import { NearLambdaConfigurator } from "./impl/near_lambda_configurator";
import * as log from "loglevel";

const SUCCESS_EXIT_CODE: number = 0;
const FAILURE_EXIT_CODE: number = 1;

// >>>>>>>>>>>>>>>>>>> REPLACE WITH YOUR OWN CONFIGURATOR <<<<<<<<<<<<<<<<<<<<<<<<
const configurator: KurtosisLambdaConfigurator = new NearLambdaConfigurator();
// >>>>>>>>>>>>>>>>>>> REPLACE WITH YOUR OWN CONFIGURATOR <<<<<<<<<<<<<<<<<<<<<<<<

const lambdaExecutor: KurtosisLambdaExecutor = new KurtosisLambdaExecutor(configurator)
lambdaExecutor.run().then(runLambdaResult => {
    let exitCode: number = SUCCESS_EXIT_CODE;
    if (runLambdaResult.isErr()) {
        console.log("A non-exception error occurred running the Kurtosis Lambda executor:");
        console.log(runLambdaResult.error);
        exitCode = FAILURE_EXIT_CODE;
    }
    process.exit(exitCode);
}).catch(reason => {
    console.log("An uncaught exception occurred running the Kurtosis Lambda executor:");
    console.log(reason);
    process.exit(FAILURE_EXIT_CODE);
});
