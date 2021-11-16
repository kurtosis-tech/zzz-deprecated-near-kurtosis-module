NEAR Kurtosis Module
=====================
This repository contains [a Kurtosis module](https://docs.kurtosistech.com/modules.html) for setting up a NEAR network locally on your machine using Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-module).

Quickstart
----------
_NOTE: If you're viewing these instructions on Github, all code blocks can be copied by hovering over the block and clicking the clipboard that appears in the top-right corner_

### Launch the local NEAR cluster in Kurtosis
1. Visit [this link](https://docs.kurtosistech.com/installation.html) to install the Kurtosis CLI (or upgrade it to latest if it's already installed)
1. Launch the local NEAR cluster:
    ```
    kurtosis module exec kurtosistech/near-kurtosis-module --execute-params '{"isWalletEnabled":true}'
    ```
    * _NOTE:_ If you'd prefer an environment that starts faster but doesn't have a Wallet, leave out the `--execute-params '{"isWalletEnabled":true}'` part. When we have a good solution for https://github.com/near/near-wallet/issues/80 , the startup time for environments with Wallets should be reduced.
1. Wait until the execution finishes, returning an output with information about the cluster (will be different on your machine):
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
1. Copy the output to a place where you can reference it in the future.
1. If you ever lose the output above, you can reacquire the service ports with the following steps:
    1. List the running Kurtosis enclaves:
        ```
        kurtosis enclave ls
        ```
    1. Copy the ID of the enclave
    1. Inspect the enclave by running the following, replacing `ENCLAVE_ID` with the enclave ID you copied:
        ```
        kurtosis enclave inspect ENCLAVE_ID
        ```

### Configure the NEAR CLI to use the local NEAR cluster
1. Save the value of the `rootValidatorKey` property into a file somewhere on your machine called `neartosis_validator_key.json`, with contents like so (public & secret keys will be different on your machine):
    ```javascript
    {
        "account_id": "test.near",
        "public_key": "ed25519:HM5NrScjfBDZH8hBJUGQnqEdD9rQdvMN9TvcuNz7pS9j",
        "secret_key": "ed25519:5uxHbUY1SoW1EUPbuJgrYU5zR6bob7kLEN19TxaMg9pbvgyqsHFvduPj3ZFK3pn8DCb6ypHEimzFQ9hyFbc23Hh7"
    }
    ```
1. Enter the following in your terminal, replacing:

    a) `NODE_URL` with the `nearNodeRpcUrl` value from the output above 

    b) `WALLET_URL` with the `walletUrl` value from above

    c) `HELPER_URL` with the `contractHelperServiceUrl` value from above
    
    d) `KEY_PATH` with the path to the `neartosis_validator_key.json` file you saved in the step above:

    ```
    alias local_near="near --nodeUrl NODE_URL --walletUrl WALLET_URL --helperUrl HELPER_URL --keyPath KEY_PATH --networkId localnet --masterAccount test.near"
    ```
1. Run NEAR CLI commands using `local_near` in place of `near`, e.g.:
    ```
    near dev-deploy --wasmFile path/to/your.wasm  -f
    ```
1. If desired, you can persist the alias above to your `~/.bash_profile` (if on Mac) or `~/.bashrc` (if on Linux) so that it's always available.

### Configure your dApp to use the local NEAR cluster running in Kurtosis
Use the same values that you used to configure the NEAR CLI to set the configuration values of your dApp (e.g. the result of `nearNodeRpcUrl` sets the node URL of your dApp's config)
