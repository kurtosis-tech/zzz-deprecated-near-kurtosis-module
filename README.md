My Kurtosis Lambda
=====================
Welcome to your new Kurtosis Lambda! You can use Example Kurtosis Lambda implementation as a pattern to create your own Kurtosis Lambda.
Quickstart steps:
1. Customize your own Kurtosis Lambda by editing the generated files inside the `/path/to/your/code/repos/kurtosis-lambda/impl` folder
    1. Rename files and objects, if you want, using a name that describes the functionality of your Kurtosis Lambda
    1. Write the functionality of your Kurtosis Lambda inside your implementation of the `KurtosisLambda.execute` method by using the serialized parameters (validating & sanitizing the parameters as necessary)
    1. Write an implementation of `KurtosisLambdaConfigurator` that accepts configuration parameters and produces an instance of your custom Kurtosis Lambda
    1. Edit the main file and replace the example `KurtosisLambdaConfigurator` with your own implementation that produces your custom Lambda
    1. Run `scripts/build.sh` to package your Kurtosis Lambda into a Docker image that can be used inside Kurtosis
