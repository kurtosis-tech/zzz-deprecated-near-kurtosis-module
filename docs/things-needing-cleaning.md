### Contract Helper DB
* We create databases for the contract-helper and the indexer from the result of:
    1. Starting a Postgres locally
    1. Cloning the contract-helper Git repo
    1. Running the contract helper migration locally
    1. Cloning the indexer-for-explorer Git repo
    1. Running the indexer-for-explorer migration locally (which requires installing `diesel`)

### Contract Helper App
* There's no working contract-helper Docker image
    * The Dockerfile needed to be set to:
        ```
        # TODO pin the Node version
        FROM node:12
        WORKDIR /usr/app
        COPY ./package.json .
        COPY ./yarn.lock .
        RUN yarn
        COPY . .
        CMD ["sh", "-c",  "yarn start-no-env"]
        ```
      and the `package.json` needed this added: `    "start-no-env": "supervisor app",`

### Indexer
* There was no indexer-for-explorer image, so I had to make one:
    ```
    # syntax=docker/dockerfile-upstream:experimental

    FROM ubuntu:18.04 as build

    RUN apt-get update -qq && apt-get install -y \
        git \
        cmake \
        g++ \
        pkg-config \
        libssl-dev \
        curl \
        llvm \
        clang \
        libpq-dev \
        ca-certificates \
        && rm -rf /var/lib/apt/lists/*

    COPY ./rust-toolchain /tmp/rust-toolchain

    ENV RUSTUP_HOME=/usr/local/rustup \
        CARGO_HOME=/usr/local/cargo \
        PATH=/usr/local/cargo/bin:$PATH

    RUN curl https://sh.rustup.rs -sSf | \
        sh -s -- -y --no-modify-path --default-toolchain "$(cat /tmp/rust-toolchain)"

    RUN cargo install diesel_cli --no-default-features --features "postgres" --bin diesel

    WORKDIR /near
    RUN cargo +"$(cat /tmp/rust-toolchain)" new --bin indexer-explorer
    WORKDIR /near/indexer-explorer

    COPY ./Cargo.toml ./Cargo.toml
    COPY ./Cargo.lock ./Cargo.lock

    # Build only dependencies first (which take ~45 minutes), so that they'll be cached for as long as the Cargo.toml/.lock aren't changed
    ENV CARGO_TARGET_DIR=/tmp/target
    ENV RUSTC_FLAGS='-C target-cpu=x86-64'
    ENV PORTABLE=ON
    RUN cargo +"$(cat /tmp/rust-toolchain)" build --release
    RUN rm src/*.rs
    RUN rm /tmp/target/release/indexer-explorer*

    COPY . .

    # This touch is necessary so that Rust doesn't skip the build (even though the source has completely changed... Rust cache is weird :P)
    RUN touch src/main.rs

    RUN cargo +"$(cat /tmp/rust-toolchain)" build --release -p indexer-explorer

    RUN /tmp/target/release/indexer-explorer --home-dir /root/.near/localnet init --fast --chain-id localnet

    # The generated config doesn't work out of the box due to https://github.com/near/near-indexer-for-explorer/issues/166
    RUN sed -i 's/"tracked_shards": \[\]/"tracked_shards": \[0\]/' /root/.near/localnet/config.json

    # If the --store-genesis flag isn't set, the accounts in genesis won't get created in the DB which will lead to foreign key constraint violations
    # See https://github.com/near/near-indexer-for-explorer/issues/167
    CMD diesel migration run && /tmp/target/release/indexer-explorer --home-dir /root/.near/localnet run --store-genesis sync-from-latest
    ```
* We flipped off the `--release` flag because it was sooo slowwww
    * The NEAR indexer-for-explorer image with `--release` on takes _45 minutes_ to build! Definitely want to optimize this
* The config files that are `init`'d by the indexer need `sed`'ing to fix
* The indexer image is 4GB big; it should be built into a multistage build (will require splitting up the migration/diesel steps into its own image)

### Wallet
* The NEAR wallet is out-of-date, so I used the `build_image.sh` in the `near-wallet` repo to build an updated one
* The NEAR wallet uses Parcel, which requires a `.env` file that only picks up environment variables at BUILD time, which requires `docker exec`ing an `npm run build` AFTER the container starts!!! This takes a _very_ long time


### Leandro annotations

INDEXER
- Kevin sent me the lates Docker image by slack
- I unzipped it with gunzip
- I pushed the image in my Docker doing:
    - `docker image load` docker image load -i near-indexer-for-explorer.tar
- The new image has bean loaded `kurtosistech/near-indexer-for-explorer:c07fb7b`
- I run the image with:
    - docker run --entrypoint sh -it kurtosistech/near-indexer-for-explorer:c07fb7b
- I executed this command inside the container:
    - export DATABASE_URL=""
- Then, the following command to run the indexer and generate the config and genesis file:
    -  ./indexer-explorer init
- Then I copied the files to the static-files folder (here you have to overwrite the existing ones but leaving a copy because later we will have to compare them and respect some values ​​that they currently have)
    - cp a17103259c00:/root/.near/config.json /Users/lporoli/Kurtosis/near-kurtosis-module/kurtosis-module/static_files/near-configs/localnet
    - Changes in config.json:
        - Dejar estos valores así: "tracked_shards": [0],
          "archive": true,
    - docker cp a17103259c00:/root/.near/genesis.json /Users/lporoli/Kurtosis/near-kurtosis-module/kurtosis-module/static_files/near-configs/localnet
    - Changes in genesis.json
        - I replaced the values that we had in the previous one:
          -  "genesis_time": "2022-05-26T17:51:59.259808104Z",
          -  "chain_id": "localnet",
          - "public_key": "ed25519:3Kuyi2DUXdoHgoaNEvCxa1m6G8xqc6Xs7WGajaqLhNmW",
          - "public_key": "ed25519:3Kuyi2DUXdoHgoaNEvCxa1m6G8xqc6Xs7WGajaqLhNmW",

CONTRACT HELPER

- I cloned the repo https://github.com/kurtosis-tech/near-contract-helper
- I commented some lines in Dockerfile.app because these will overwrite the env that we are setting in Near Kurtosis Module:
    - The Dockerfile.app now looks like this:
    # I commented this line because we are setting the env variables in Near Kurtosis Module
    # FROM nearprotocol/bridge as bridge
    FROM node:12
    WORKDIR /usr/app
    COPY ./package.json .
    COPY ./yarn.lock .
    RUN yarn
    COPY . .
    # I commented these lines because we are setting the env variables in Near Kurtosis Module
    # and if we left these, the others will be overwritten
    # RUN grep -v ACCOUNT_CREATOR_KEY .env.sample | grep -v NODE_URL | grep -v INDEXER_DB_CONNECTION > .env
    # COPY --from=bridge /root/.near/localnet/node0/validator_key.json .
    # RUN ACCOUNT_CREATOR_KEY=$(cat validator_key.json | tr -d " \t\n\r") && echo "ACCOUNT_CREATOR_KEY=$ACCOUNT_CREATOR_KEY" >> .env
    CMD ["sh", "-c",  "sleep 10 && yarn start-no-env"]
- I also added this configuration in the package.json file
  - "start-no-env": "supervisor app" (inside the script section)
- I edited some env vars in services-> contract_helper.ts (inside this repo):
  - "TWILIO_ACCOUNT_SID": "ACtest", // account SID from Twilio (used to send security code)
    "TWILIO_AUTH_TOKEN": "test"
- I added extra env because the app was throwing erros without theses:
  - "FUNDED_ACCOUNT_CREATOR_KEY": "{}",
    "ACCOUNT_CREATOR_KEYS":'{"private_keys":[]}'
- I built the Docker image running:
    - docker build -t kurtosistech/near-contract-helper:dd16f8c -f ./Dockerfile.app ./
- This image was generated: kurtosistech/near-contract-helper:dd16f8c


EXPLORER BACKEND

- I cloned Near explorer: git clone git@github.com:near/near-explorer.git
- The package-lock.json file in backend, frontend and common folders were deleted so I have to search for these in old commits using git bisect, then I found them and I copied them inside each folder
- I edited backend Docker file, adding:
  COPY ./tsconfig.json ../
- I built it with:
    - docker build -t kurtosistech/near-explorer_backend:8df44b7 -f ./backend/Dockerfile ./
- I edited frontend Docker file, adding
    - COPY ./tsconfig.json ../
    - It fails when I try to build it

  IMAGES:
  - Backend: kurtosistech/near-explorer_backend:8df44b7
  - Frontend:
  - Wamp: kurtosistech/near-explorer_wamp:8df44b7


WALLET
- I cloned repo https://github.com/near/near-wallet. master branch
- I built the image with:
    - docker build -t kurtosistech/near-wallet:6e3e98c -f ./Dockerfile ./
- This image was generated: kurtosistech/near-wallet:6e3e98c
