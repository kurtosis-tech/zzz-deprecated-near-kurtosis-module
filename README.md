NEAR Kurtosis Module
=====================
This repository contains [an executable Kurtosis module](https://docs.kurtosistech.com/advanced-usage.html#kurtosis-lambdas) for setting up a NEAR network inside of Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-module).

Run it with [the CLI](https://docs.kurtosistech.com/installation.html) with:

```
kurtosis module exec kurtosistech/near-kurtosis-module
```

_NOTE:_ This will take about 2 minutes to start, half of which is the Wallet building inside its Docker container. When we have a good solution for https://github.com/near/near-wallet/issues/80 , this startup time should be reduced by about a minute.
