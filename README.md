NEAR Kurtosis Module
=====================
This repository contains [an executable Kurtosis module](https://docs.kurtosistech.com/modules.html) for setting up a NEAR network inside of Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-module).

### Local NEAR Development Environment Quickstart

1. Install [the Kurtosis CLI](https://docs.kurtosistech.com/installation.html) if you haven't yet.
1. Run the local NEAR development environment with [the CLI](https://docs.kurtosistech.com/installation.html) with:
        
        kurtosis module exec kurtosistech/near-kurtosis-module
    * _NOTE:_ The environment that gets started won't have a wallet. If you want a wallet, add the following flag `--execute-params '{"isWalletEnabled":true}'` to the `module exec` command. This will take an extra 1-2 minutes to start. When we have a good solution for https://github.com/near/near-wallet/issues/80 , this startup time should be reduced.
1. Get the host and ports for each of the services in your environment from the output of the `kurtosis module exec` command, which should look something like the following (your ports will be different):
    ```javascript
    {
        "networkName": "localnet",
        "rootValidatorKey": {
            "account_id": "test.near",
            "public_key": "ed25519:HM5NrScjfBDZH8hBJUGQnqEdD9rQdvMN9TvcuNz7pS9j",
            "secret_key": "ed25519:5uxHbUY1SoW1EUPbuJgrYU5zR6bob7kLEN19TxaMg9pbvgyqsHFvduPj3ZFK3pn8DCb6ypHEimzFQ9hyFbc23Hh7"
        },
        "nearNodeRpcUrl": "http://127.0.0.1:56212",
        "contractHelperServiceUrl": "http://127.0.0.1:56213",
        "walletUrl": "http://127.0.0.1:56218",
        "explorerUrl": "http://127.0.0.1:56216"
    }
    ```
1. Communicate with your local development environment by pointing your code editor, postman, etc. to your own local services!
