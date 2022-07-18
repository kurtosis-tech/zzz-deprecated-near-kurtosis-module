# TBD

### Changes
* Migrate repo to use internal cli tool, `kudet`, for release workflow and getting docker image tags
* Upgrade core to 1.55.2

# 0.5.23
### Fixes
* Fixed a bug where the Explorer wasn't respecting the `backendIpAddress` request from the user's execute params

# 0.5.22
### Fixes
* Upgrade all services to latest versions, as an emergency bugfix for the latest NEAR CLI not working with the images inside Kurtosis

### Removals
* Removed the WAMP because it's no longer required for the explorer

# 0.5.21
### Fixes
* Disabled wait-for-availability check for now because it doesn't seem to work on M1 Macs for unknown reasons (and all our users are blocked)

# 0.5.20
### Changes
* Upgraded Ubuntu machine image in Circle CI configuration to version `ubuntu-2004:202201-02`
* Upgraded `ansi-regex` to v5.0.1 due the vulnerability found by dependabot in v5.0.0

# 0.5.19
### Features
* Added wait-for-availability checks to the indexer, wallet, contract-helper service, explorer-wamp, and explorer

### Fixes
* Fixed an issue with the indexer database not getting created

# 0.5.18
### Features
* Implemented static public ports

### Changes
* Upgrade to module-api-lib 0.16.0 to support the latest version of Kurtosis
* Upgrade to kurtosis-core-api-lib 1.54.1 which adds support for static ports
* The indexer now has a static validator private key:

  ```
  {
    "account_id": "test.near",
    "public_key": "ed25519:3Kuyi2DUXdoHgoaNEvCxa1m6G8xqc6Xs7WGajaqLhNmW",
    "secret_key": "ed25519:2ykcMLiM7vCmsSECcgfmUzihBtNdBv7v2CxNi94sNt4R8ar4xsrMMYvtsSNGQDfSRhNWXEnZvgx2wzS9ViBiS9jW"
  }
  ```
  
### Fixes
* The module now correctly uses static files

# 0.5.17
### Changes
* Upgrade to module-api-lib 0.15.0 to support the latest version of Kurtosis

# 0.5.16
### Fixes
* Upgrade to module-api-lib 0.14.1 to support the latest version of Kurtosis

# 0.5.15
### Features
* Allow users to pass in `--execute-params '{"backendIpAddress": "1.2.3.4"}'` to override the backend IP address that the Wallet & Explorer frontends use for getting data

# 0.5.14
### Fixes
* Added a guard to avoid reinitializing the database & config directory inside the indexer if it's already initialized, which will help users restart stopped environments
* Updated to be based on indexer-for-explorer 0.10.10, which is itself based on nearcore 1.24.0

# 0.5.13
### Features
* Expose the gossip port on the indexer/NEAR node as well

### Changes
* Moved the Kurtosis CLI installation in the "Install Prerequisites" section up to 2, to make it more obvious
* Removed the quickstart docs here in favor of [the official NEAR docs](https://docs.near.org/docs/tools/kurtosis-localnet)

### Fixes
* Add the `config init` to our CI

# 0.5.12
### Changes
* All NEAR networks now start with a Wallet
* The module no longer requires any parameters

### Fixes
* Changed the approach we were using to start the Wallet, so that the Wallet now starts nearly instantly

# 0.5.11
### Features
* Upgrade to `module-api-lib` 0.12.0, which is compatible with the latest version of Kurtosis

### Removals
* Removed the unused `nearup` service

# 0.5.10
### Fixes
* Fixed a missing `'` at the end of the alias command

# 0.5.9
### Fixes
* Remove the `--masterAccount` flag from the `local_near` alias

# 0.5.8
### Features
* Make the launch-local-near-cluster.sh script better align with the tutorial on the NEAR website

# 0.5.7
### Fixes
* Made README even clearer about what's going on

# 0.5.6
### Changes
* Significantly automated the launching of NEAR local clusters by adding the `launch-local-near-cluster.sh` script and refactoring the README significantly

# 0.5.5
### Fixes
* Use indexer node version 0.2.0, which:
    * Disables fast blocks (so less CPU/memory usage)
    * Is in archival mode, so won't lose transactions after 500 blocks

# 0.5.4
### Fixes
* Bump Wallet availability wait time to 6m (was 3m) because when your CPU is heavily-loaded (e.g. compiling something) it can take longer to compile the Wallet

# 0.5.3
### Fixes
* Replace accidental `near` reference in quickstart with `local_near`

# 0.5.2
### Features
* Updated the README with more detailed quickstart for NEAR users

# 0.5.1
### Fixes
* Update README to reflect new module output

# 0.5.0
### Features
* Result JSON string is pretty-printed
* Result JSON now contains two extra fields:
    * `networkName`
    * `rootValidatorKey`

### Breaking Changes
* The result object has been refactored to remove the WAMP and the `maybe` prefix, as well as adding some additional fields
    * Users should modify their code to accept the new properties:
        * `networkName`
        * `rootValidatorKey`
        * `nearNodeRpcUrl`
        * `contractHelperServiceUrl`
        * `walletUrl`
        * `explorerUrl`

# 0.4.5
### Fixes
* Add a retry for getting the node validator key, rather than failing immediately

# 0.4.4
### Features
* Optimized the Dockerfile reducing the size to ~100MB (was 330MB)

# 0.4.3
### Features
* Add a use-case specific quickstart for NEAR users
* Add a flag, `isWalletEnabled`, to disable starting the wallet (`false` by default)

### Fixes
* Set the Wallet's `ACCOUNT_SUFFIX` variable to `near`, to match what gets created in the Genesis block

# 0.4.2
### Changes
* Upped the wallet wait-for-availability time from 2m to 3m

# 0.4.1
### Fixes
* Fix broken README links

# 0.4.0
### Removals
* Removed the world-public download token in CircleCI config when installing Kurtosis CLI, as it's no longer needed

### Changes
* Use the new module API lib, which replaces all references of "Lambda" with "module"

### Breaking Changes
* Upgrade to the [module API lib 0.10.0](https://github.com/kurtosis-tech/kurtosis-module-api-lib/blob/develop/docs/changelog.md#0100), which replaces all references of "Lambda" with "module"
    * Users will need the latest version of Kurtosis CLI which has `module exec` rather than `lambda exec` to run this NEAR module

# 0.3.5
### Features
* Add a Wallet service
* Actually run the Lambda as part of CI

# 0.3.4
### Features
* Publish a `latest` tag

### Changes
* Made the directions for running the Lambda in the README much simpler

# 0.3.3
### Features
* Upgrade to [Lambda API Lib 0.9.2](https://github.com/kurtosis-tech/kurtosis-lambda-api-lib/blob/develop/docs/changelog.md#092)

# 0.3.2
### Fixes
* Uploaded to [Lambda API Lib 0.9.1](https://github.com/kurtosis-tech/kurtosis-lambda-api-lib/blob/develop/docs/changelog.md#091)

# 0.3.1
### Fixes
* Fix typo in Docker image-publishing CI job

# 0.3.0
### Features
* Start:
    * A local NEAR node running the indexer
    * The contract helper service
    * The explorer backend, WAMP, and frontend

### Fixes
* Pinned base Node image in Dockerfile to `node:14.17.6-alpine3.14`

### Changes
* Upgrade to `lambda-api-lib` 0.9.0

### Breaking Changes
* Completely revamp the return type to provide frontend URLs for various services

# 0.2.1
### Features
* Build Docker image named `kurtosistech/near-kurtosis-lambda`
* Properly version Docker images using Git history

# 0.2.0
### Features
* Start a NEAR Explorer, backed by a local backend & WAMP, backed by the public testnet indexer

# 0.1.0
* Initial commit
