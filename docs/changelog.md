# TBD

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
