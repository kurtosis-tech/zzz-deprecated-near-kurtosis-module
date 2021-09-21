NEAR Kurtosis Lambda
=====================
This repository contains a [Kurtosis Lambda](https://docs.kurtosistech.com/advanced-usage.html#kurtosis-lambdas) for setting up a NEAR network inside of Kurtosis.

Janky Things
------------
* There's no working contract-helper Docker image
* We create databases for the contract-helper and the indexer from the result of:
    1. Starting a Postgres locally
    1. Cloning the contract-helper Git repo
    1. Running the contract helper migration locally
    1. Cloning the indexer-for-explorer Git repo
    1. Running the indexer-for-explorer migration locally (which requires installing `diesel`)
