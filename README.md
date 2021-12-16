NEAR Kurtosis Module
=====================
This repository contains [a Kurtosis module](https://docs.kurtosistech.com/modules.html) for setting up a NEAR network locally on your machine using Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-module).

Quickstart
----------
These quickstart instructions will do the following:
1. Start a local NEAR cluster, running in Kurtosis, complete with Wallet, Explorer, indexer, etc.
1. Save the output of starting the cluster, and the cluster's master validator key JSON file, to the `~/.neartosis` directory
1. Display an alias and set of URLs for interacting with the cluster

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
1. Update to the latest version of the NEAR CLI:
    ```
    npm install -g near-cli
    ```

### Launch the local NEAR cluster in Kurtosis
1. Save [this script](./launch-local-near-cluster.sh) to your local machine (which can be used to start arbitrary numbers of NEAR clusters):
    ```
    curl -o ~/launch-local-near-cluster.sh https://raw.githubusercontent.com/kurtosis-tech/near-kurtosis-module/master/launch-local-near-cluster.sh
    ```
1. Execute the script:
    ```
    bash ~/launch-local-near-cluster.sh
    ```
1. Follow the instructions that the script prints

### Manage your local NEAR cluster
The cluster you started will continue to run on your local machine for as long as your Docker engine is running (which, in most cases, is for as long as you don't restart your computer). The cluster runs inside of a Kurtosis "enclave", an environment isolated from both your computer and other enclaves; in practice, this means that you can have multiple independent local NEAR clusters running on your machine simply by rerunning the `kurtosis module exec` command from the start of this guide.

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

### Configure your dApp to use the local NEAR cluster running in Kurtosis
Use the values outputted during cluster launch (e.g. `nearNodeRpcUrl`, `walletUrl`, etc.) to fill the configuration values of your dApp.
