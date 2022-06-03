NEAR Kurtosis Module
=====================
This repository contains [a Kurtosis module](https://docs.kurtosistech.com/modules.html) for setting up a NEAR network locally on your machine using Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-module).

The validator key of the node that it starts is:
```
{
  "account_id": "test.near",
  "public_key": "ed25519:3Kuyi2DUXdoHgoaNEvCxa1m6G8xqc6Xs7WGajaqLhNmW",
  "secret_key": "ed25519:2ykcMLiM7vCmsSECcgfmUzihBtNdBv7v2CxNi94sNt4R8ar4xsrMMYvtsSNGQDfSRhNWXEnZvgx2wzS9ViBiS9jW"
}
```

The URLs of the services started inside Kurtosis are as follows:
* Near node RPC URL: `http://127.0.0.1:8332`,
* Contract helper service URL: `http://127.0.0.1:8330`,
* Wallet URL: `http://127.0.0.1:8334`,
* Explorer URL: `http://127.0.0.1:8331`

Quickstart
----------
Follow the instructions on [the NEAR docs](https://docs.near.org/docs/tools/kurtosis-localnet).

For Kurtosis Devs: Upgrading Dependencies
-----------------------------------------
### Rebuild the indexer-for-explorer NEAR node
1. Clone [the NEAR indexer-for-explorer repository](https://github.com/near/near-indexer-for-explorer)
1. Pull the latest `master` branch
1. In the root of the repo, build a Docker image (will take ~45 minutes!):
   ```
   docker build -f Dockerfile -t "kurtosistech/near-indexer-for-explorer:$(git rev-parse --short HEAD)" .
   ```
1. Slot the produced image-and-tag into the `IMAGE` constant in the `indexer.ts` file

### Rebuild the contract helper service
1. Clone [the NEAR contract-helper-service repository](https://github.com/kurtosis-tech/near-contract-helper)
1. Pull the latest `master` branch
1. In the root of the repo, build a Docker image:
   ```
   docker build -f Dockerfile.app -t "kurtosistech/near-contract-helper:$(git rev-parse --short HEAD)" .
   ```
1. Slot the produced image-and-tag into the `IMAGE` constant in the `contract_helper.ts` file

### Rebuild the explorer backend & frontend
1. Clone the [NEAR explorer repository](https://github.com/near/near-explorer)
1. Pull the latest `master` branch
1. In the root of the repo, build an explorer backend Docker image:
   ```
   docker build -f backend/Dockerfile -t "kurtosistech/near-explorer_backend:$(git rev-parse --short HEAD)" .
   ```
1. Slot the produced image-and-tag into the `IMAGE` constant in the `explorer_backend.ts` file
1. In the root of the repo, build an explorer backend Docker image:
   ```
   docker build -f frontend/Dockerfile -t "kurtosistech/near-explorer_frontend:$(git rev-parse --short HEAD)" .
   ```
1. Slot the produced image-and-tag into the `IMAGE` constant in the `explorer_frontend.ts` file

### Rebuild the wallet
1. Clone the [NEAR wallet](https://github.com/near/near-wallet)
1. Pull the latest `master` branch
1. In the root of the repo, build a Docker image:
   ```
   docker build -f Dockerfile -t "kurtosistech/near-wallet:$(git rev-parse --short HEAD)" .
   ```
1. Slot the produced image-and-tag into the `IMAGE` constant in the `wallet.ts` file

### Test the module
1. Rebuild & rerun the module (replacing `THE_BUILT_TAG` with the tag of the module that gets built locally):
  ```
  kurtosis clean -a && ./scripts/build.sh && kurtosis module exec kurtosistech/near-kurtosis-module:THE_BUILT_TAG
  ```
1. Debug & fix any errors, opening issues on the various NEAR repositories as necessary (this is the fastest way to interact with the NEAR devs)
    * NOTE: the NEAR wallet doesn't have a productized way to be configured at runtime (only at buildtime!) because it uses Parcel to precompile & minify all the Javascript into a single file; this means that to point the Wallet at the local services inside of Kurtosis we do janky `sed`'ing to replace variable values inside the minified Wallet Javascript file 
1. Repeat the dev loop as necessary

### Release the module
1. Push the images that your module version is now using (easy way to find them: go through the `IMAGE` constants in each file)
1. Cut a PR
1. Once it's approved, merge & release
