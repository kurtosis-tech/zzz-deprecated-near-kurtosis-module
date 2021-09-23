NEAR Kurtosis Lambda
=====================
This repository contains a [Kurtosis Lambda](https://docs.kurtosistech.com/advanced-usage.html#kurtosis-lambdas) for setting up a NEAR network inside of Kurtosis. It is published to Dockerhub [here](https://hub.docker.com/repository/docker/kurtosistech/near-kurtosis-lambda).

Run it in [Kurtosis sandbox](https://docs.kurtosistech.com/sandbox.html) like so:

```javascript
loadLambdaResult = await networkCtx.loadLambda("near-lambda", "kurtosistech/near-kurtosis-lambda:0.3.1", "{\"logLevel\":\"debug\"}")
lambdaCtx = loadLambdaResult.value
executeResult = await lambdaCtx.execute("{}")
executeResultObj = JSON.parse(executeResult.value)
console.log(executeResultObj)
```
