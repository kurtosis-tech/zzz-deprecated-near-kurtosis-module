NEAR Kurtosis Lambda
=====================
This repository contains a [Kurtosis Lambda](https://docs.kurtosistech.com/advanced-usage.html#kurtosis-lambdas) for setting up a NEAR network inside of Kurtosis.

Janky Things
------------
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
