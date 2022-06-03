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
1. Build a new image of the NEAR indexer-for-explorer using the latest code
    1. Clone [the Kurtosis fork of the NEAR indexer-for-explorer](https://github.com/kurtosis-tech/near-indexer-for-explorer)
    1. Run `git fetch upstream` to pull the latest changes to your local copy of the repo
    1. Check out the `kurtosis` branch
    1. Run `git merge upstream/master` to merge the latest changes into the Kurtosis branch
    1. Run `build-docker-image.sh` to build the image (this will take ~45 minutes!)


* TODO Wallet doesn't have a way to configure at runtime (only build), so we have to `sed` the Parcel-compiled, minified `.js` file
