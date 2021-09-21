# TBD
### Features
* Added `nearup` to start a local NEAR network inside the `nearup` Docker image

### Fixes
* Pinned base Node image in Dockerfile to `node:14.17.6-alpine3.14`

### Changes
* Upgrade to `lambda-api-lib` 0.9.0

### Breaking Changes
* Add a URL to the result for accessing the `nearcore` daemons started inside the `nearup` Docker container

# 0.2.1
### Features
* Build Docker image named `kurtosistech/near-kurtosis-lambda`
* Properly version Docker images using Git history

# 0.2.0
### Features
* Start a NEAR Explorer, backed by a local backend & WAMP, backed by the public testnet indexer

# 0.1.0
* Initial commit
