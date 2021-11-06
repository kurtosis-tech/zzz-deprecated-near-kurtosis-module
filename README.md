NEAR Kurtosis Module
=====================
This repository contains [an executable Kurtosis module](https://docs.kurtosistech.com/modules.html) for setting up a NEAR network inside of Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-module).

### Local NEAR Development Environment Quickstart

1. Install [the Kurtosis CLI](https://docs.kurtosistech.com/installation.html) if you haven't yet.
1. Run the local NEAR development environment with [the CLI](https://docs.kurtosistech.com/installation.html) with:
        
        kurtosis module exec kurtosistech/near-kurtosis-module
    * _NOTE:_ The environment that gets started won't have a wallet. If you want a wallet, add the following flag `--execute-params '{"isWalletEnabled":true}'` to the `module exec` command. This will take an extra 1-2 minutes to start. When we have a good solution for https://github.com/near/near-wallet/issues/80 , this startup time should be reduced.
1. Get the host and ports for each of the services in your environment from the output of the `kurtosis module exec` command, which should look something like:

        {"maybeHostMachineNearNodeUrl":"<URL>","maybeHostMachineContractHelperUrl":"<URL>",
        ...}
1. Communicate with your local development environment by pointing your code editor, postman, etc. to your own local services!
