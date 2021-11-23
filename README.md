NEAR Kurtosis Module
=====================
This repository contains [a Kurtosis module](https://docs.kurtosistech.com/modules.html) for setting up a NEAR network locally on your machine using Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-module).

Quickstart
----------
_NOTE: If you're viewing these instructions on Github, all code blocks can be copied by hovering over the block and clicking the clipboard that appears in the top-right corner_

### Install prerequisites
1. Make sure Docker is running with at least 4GB of memory:
    1. If you don't already have Docker installed, do so using [this link](https://docs.docker.com/get-docker/)
    1. Open the "Docker Desktop" program (which will start your Docker engine if it's not running already)
    1. Give Docker >= 4GB of memory:
        1. Click the gear icon in the top-right of Docker Desktop
        1. Select the "Resources" tab from the left-hand menu
        1. Give Docker at least 4GB of memory
        1. Select "Apply & Restart"
        1. Wait until the whale icon in the bottom-left corner is green once more
1. Visit [this link](https://docs.kurtosistech.com/installation.html) to install the Kurtosis CLI (or upgrade it to latest if it's already installed)

### Launch the local NEAR cluster in Kurtosis
1. Create a directory to store your NEAR Kurtosis info:
    ```
    mkdir ~/near-kurtosis && cd ~/near-kurtosis
    ```
1. Launch the local NEAR cluster:
    ```
    kurtosis module exec kurtosistech/near-kurtosis-module --execute-params '{"isWalletEnabled":true}' | tee ~/near-kurtosis/near-module-output_$(date +%FT%H.%M.%S).log
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

The command you ran `tee`'d the output to a new file called `near-module-log_YYYY-MM-DDTHH.MM.SS.log`, so if you ever the lose the output above you can open that file to view the URLs, ports, etc.

You can open the Wallet and Explorer URls from above in your browser to access these services for the local cluster. The cluster is fresh, so all account names should be free.

### Manage your local NEAR cluster
The cluster you started will continue to run on your local machine for as long as your Docker engine is running (which, in most cases, is for as long as you don't restart your computer). The cluster runs inside of a Kurtosis "enclave", an environment isolated from both your computer and other enclaves; in practice, this means that you can have multiple independent local NEAR clusters running on your machine simply be rerunning the `kurtosis module exec` command from the start of this guide.

To see the status of your existing enclaves, run:

    ```
    kurtosis enclave ls
    ```

To see detailed information about an enclave, copy an enclave ID and run:

    ```
    kurtosis enclave inspect THE_ENCLAVE_ID
    ```

To shut down your cluster to free up resources on your machine, run the following (NOTE: You will not be able to restart the cluster! If this is something you need, please file an issue [here](https://github.com/kurtosis-tech/kurtosis-cli-release-artifacts) so we can prioritize it):

    ```
    kurtosis enclave stop THE_ENCLAVE_ID
    ```

Stopping an enclave leaves its resources intact so that you can examine them if need be. To destroy a stopped enclave and free its resources, run:

    ```
    kurtosis clean
    ```

If you would like to destroy _all_ enclaves, regardless of if they're running, pass the `-a` flag to `clean` like so:

    ```
    kurtosis clean -a
    ```

This can be a handy way to clear all your Kurtosis data.

### Configure the NEAR CLI to use the local NEAR cluster
1. Change to the directory we created to store your NEAR Kurtosis cluster information:
    ```
    cd ~/near-kurtosis
    ```
1. Bind the name of the file containing the most recent module output (which will have been saved in a file named `near-module-log_YYYY-MM-DDTHH.MM.SS.log`) to the `MODULE_OUTPUT_FILEPATH` variable:
    ```
    MODULE_OUTPUT_FILEPATH="the-name-of-the-file.log"
    ```
1. Paste the following chunk of code into your terminal, which will a) create a `neartosis-validator-key_YYYY-MM-DDTHH.MM.SS.json` file and b) create a `local_near` command in your current shell for connecting to the NEAR environment in Kurtosis that behaves just like the `near` CLI:
    ```bash
    # Constants
    VALIDATOR_KEY_PROPERTY_W_QUOTES='"rootValidatorKey":'
    NETWORK_ID_PROPERTY="networkName"
    MASTER_ACCOUNT_PROPERTY="account_id"
    NODE_RPC_URL_PROPERTY="nearNodeRpcUrl"
    HELPER_URL_PROPERTY="contractHelperServiceUrl"
    WALLET_URL_PROPERTY="walletUrl"
    COMMAND_NAME="local_near"

    # Extracts values from the module execution output, and generates a 'local_near' alias for connecting to the NEAR cluster
    function get_alias_str_contents() {
        if [ -z "${MODULE_OUTPUT_FILEPATH}" ]; then
            echo "The MODULE_OUTPUT_FILEPATH variable must to be set to the 'module exec' output logfile (near-module-output_YYYY-MM-DDTHH.MM.SS.log) that you want to extract cluster information from" >&2
            return 1
        fi

        function get_json_property() {
            property_name="${1}"
            cat "${MODULE_OUTPUT_FILEPATH}" | grep "${property_name}" | awk '{print $NF}' | sed 's/^"//' | sed 's/",*$//'
        }

        validator_key_filename="neartosis-validator-key_$(date +%FT%H.%M.%S).json"
        validator_key_filepath="$(pwd)/${validator_key_filename}"
        cat "${MODULE_OUTPUT_FILEPATH}" | awk "/${VALIDATOR_KEY_PROPERTY_W_QUOTES}/,/\}/" | sed "s/${VALIDATOR_KEY_PROPERTY_W_QUOTES}//" | sed 's/},/}/' > "${validator_key_filename}"

        network_id="$(get_json_property "${NETWORK_ID_PROPERTY}")"
        master_account="$(get_json_property "${MASTER_ACCOUNT_PROPERTY}")"
        node_url="$(get_json_property "${NODE_RPC_URL_PROPERTY}")"
        helper_url="$(get_json_property "${HELPER_URL_PROPERTY}")"
        wallet_url="$(get_json_property "${WALLET_URL_PROPERTY}")"

        echo "near --nodeUrl ${node_url} --walletUrl ${wallet_url} --helperUrl ${helper_url} --keyPath ${validator_key_filepath} --networkId ${network_id} --masterAccount ${master_account}"
    }

    if alias_str_contents="$(get_alias_str_contents)"; then
        echo "alias ${COMMAND_NAME}='${alias_str_contents}'"
        alias "${COMMAND_NAME}=${alias_str_contents}"
    fi
    ```
1. If you'd like, copy the `alias local_near="......."` output into your `.bashrc`, `.bash_profile`, `.zshrc`, etc. if you want it to be available in every terminal you open
1. Test that the command works by logging in to the local cluster using the local Wallet:
    ```
    local_near login
    ```

You can now run NEAR CLI commands using `local_near` in place of `near`. For example, to send some NEAR using the following (replacing `youraccount.test.near` with the account you created on login):
    ```
    local_near send youraccount.test.near test.near 1
    ```

### Configure your dApp to use the local NEAR cluster running in Kurtosis
Use the values outputted by `module exec` (e.g. `nearNodeRpcUrl`, `walletUrl`, etc.) to fill the configuration values of your dApp.
