# Datapio SDK Kubernetes Operator

The **Datapio SDK Kubernetes Operator** provides a declarative way to interact
with a Kubernetes Cluster and watch resources.

It allows you to:

 - watch Kubernetes resources
 - expose a HealthCheck for Kubernetes Readiness/Liveness Probes on `/health`
 - expose a Metrics endpoint for Prometheus on `/metrics` (soon)
 - expose a GraphQL API on `/graphql`
 - expose a custom HTTP API on `/api`
 - endpoint listenning on HTTP(S)

### Installation

This project is distributed via
[Github Packages' NPM registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry):

```bash
$ npm install @datapio/sdk-k8s-operator
```

### Usage

The SDK provides an `Operator` class that you can inherit from:

```typescript
import { Operator } from '@datapio/sdk-k8s-operator'

class MyOperator extends Operator {
  constructor() {
    super({
      /* options */
    })
  }
}
```

You can then instantiate and use your operator:

```typescript
const operator = new MyOperator()

// start the operator
await operator.service.listen()
```
