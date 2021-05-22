/**
 * The Operator defines a class used to:
 *
 *  - watch Kubernetes resources
 *  - expose a HealthCheck for Kubernetes Readiness/Liveness Probes on `/health`
 *  - expose a Metrics endpoint for Prometheus on `/metrics` (soon)
 *  - expose a GraphQL API on `/graphql`
 *  - expose a custom HTTP API on `/api`
 *  - endpoint listenning on HTTP(S)
 *
 * @module operator
 */

import mergeOptions from 'merge-options'
import * as kubernetes from 'kubernetes-client'

import { ApolloServer } from 'apollo-server-express'
import express from 'express'

import cookieParser from 'cookie-parser'
import cors from 'cors'

import { KubeInterfaceOptions } from '../kube-interface/types'
import { KubeInterface } from '../kube-interface'

import { ResourceWatcher } from './resource-watcher'
import { ServerFactory } from './server-factory'
import { WebService } from './web-service'
import { makeTokenProcessor } from './auth'

import * as t from './types'
import * as o from './options'

/**
 * Declarative interface for the Kubernetes Operator.
 */
export class Operator {
  /** List of {@link ResourceWatcher} objects. */
  watchers: ResourceWatcher[]
  /** Interface to Kubernetes API Server. */
  kubectl: KubeInterface
  /** Endpoint to access the GraphQL API, custom API, HealthChecks and metrics. */
  webapp: express.Application
  /** Custom HTTP API served over `/api`. */
  api: express.RequestHandler
  /** ApolloServer served over `/graphql`. */
  apollo?: ApolloServer
  /** {@link WebService} object used to expose the endpoint. */
  service: WebService

  /** Operator configuration. */
  options: t.OperatorOptions

  /**
   * @param opts User supplied configuration.
   */
  constructor(opts: t.RecursivePartial<t.OperatorOptions>) {
    this.options = mergeOptions(o.Operator, opts)
    const {
      apiFactory,
      watchers,
      serverOptions,
      kubeOptions,
      apolloOptions,
      corsOptions,
      cookieSecret,
      authCookieName
    } = this.options

    this.watchers = <ResourceWatcher[]> watchers

    this.kubectl = new KubeInterface(<KubeInterfaceOptions> kubeOptions)

    this.api = apiFactory(this.kubectl)
    this.webapp = express()
    this.webapp.use(cors(corsOptions))
    this.webapp.use(cookieParser(cookieSecret))
    this.webapp.use('/api', this.api)

    if (apolloOptions.enabled) {
      this.webapp.get('/graphql/logout', (req, res) => {
        res.cookie(authCookieName, { expires: Date.now() })
        res.end('')
      })

      const authTokenProcessor = makeTokenProcessor(authCookieName)

      const userContext = apolloOptions.context
      apolloOptions.context = async ({ req, res, ...args }) => {
        const ctx = typeof userContext === 'function'
          ? await userContext({ req, res, ...args })
          : (userContext || {})

        const kubeConfig = new kubernetes.KubeConfig()

        kubeConfig.loadFromString(
          JSON.stringify({
            apiVersion: 'v1',
            kind: 'Config',
            clusters: [],
            users: [],
            contexts: [],
            'current-context': ''
          })
        )

        const currentCluster = this.kubectl.config.getCurrentCluster()!
        const contextName = this.kubectl.config.getCurrentContext()
        const currentContext = this.kubectl.config.getContextObject(contextName)!

        kubeConfig.addCluster(currentCluster)

        const token = authTokenProcessor(req, res)

        kubeConfig.addUser({
          name: 'graphql-client',
          token
        })
        kubeConfig.addContext({
          cluster: currentCluster.name,
          name: 'graphql-request',
          user: 'graphql-client',
          namespace: currentContext.namespace
        })
        kubeConfig.setCurrentContext('graphql-request')

        const kubectl = new KubeInterface({
          crds: this.kubectl.crds,
          createCRDs: false,
          config: kubeConfig
        })
        await kubectl.load()

        return {
          kubectl,
          ...ctx
        }
      }

      this.apollo = new ApolloServer(apolloOptions)
      this.apollo.applyMiddleware({
        app: this.webapp,
        path: '/graphql'
      })
    }

    const serverFactory = new ServerFactory(serverOptions)
    this.service = new WebService(this, serverFactory)
  }

  /**
   * Hook called by {@link WebService} before listenning for requests.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async initialize() {}

  /**
   * Hook called by {@link WebService} before shutting down (on `SIGINT`
   * or `SIGTERM`).
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async terminate() {}

  /**
   * Hook called by {@link WebService} on requests to `/health`.
   *
   * NB: if that method is not overidden, it will always return `true`.
   *
   * @returns `true` if the operator is healthy or `false` otherwise.
   */
  async healthCheck() {
    return true
  }

  /**
   * Hook called by {@link WebService} on requests to `/metrics`.
   *
   * NB: if that method is not overidden, it will always return `{}`.
   *
   * @returns A JSON-serializable object containing the metrics to export.
   */
  async metrics() {
    return {}
  }
}
