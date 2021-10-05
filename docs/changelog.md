# TBD
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
