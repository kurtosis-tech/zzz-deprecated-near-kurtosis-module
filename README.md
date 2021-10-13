NEAR Kurtosis Lambda
=====================
This repository contains a [Kurtosis Lambda](https://docs.kurtosistech.com/advanced-usage.html#kurtosis-lambdas) for setting up a NEAR network inside of Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-lambda).

Run it with [the CLI](https://docs.kurtosistech.com/installation.html) with:

```
kurtosis lambda exec kurtosistech/near-kurtosis-lambda
```

_NOTE:_ This will take about 2 minutes to start, half of which is the Wallet building inside its Docker container. When we have a good solution for https://github.com/near/near-wallet/issues/80 , this startup time should be reduced by about a minute.
