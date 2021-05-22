/**
 * Abstraction over `@godaddy/terminus` to handle:
 *
 *  - `SIGINT` and `SIGTERM` signals
 *  - Kubernetes Readiness/Liveness probes
 *  - Prometheus Metric Exporter (soon)
 *  - {@link ResourceWatcher} objects
 *
 * @module operator/web-service
 */

import { createTerminus } from '@godaddy/terminus'

import { CancelScope } from '../cancel-scope'
import { ServerFactory } from './server-factory'
import { Operator } from './index'

import * as t from './types'

/**
 * Encapsulate `@godaddy/terminus`.
 */
export class WebService {
  /** {@link Operator} owning this object. */
  operator: Operator
  /** List of HTTP(S) servers to manage. */
  servers: t.ServerList
  /** {@link ResourceWatcher} cancel scopes. */
  cancelScopes: CancelScope[]

  /**
   * @param operator {@link Operator} owning this object.
   * @param serverFactory Factory used to build the HTTP(S) servers.
   */
  constructor(operator: Operator, serverFactory: ServerFactory) {
    this.operator = operator
    this.servers = serverFactory.make(this.operator.webapp)
    this.cancelScopes = []

    this.servers.map(({ server }) => createTerminus(server, {
      healthChecks: {
        '/health': this.operator.healthCheck.bind(this.operator),
        '/metrics': this.operator.metrics.bind(this.operator),
        verbatim: true
      },
      beforeShutdown: this.beforeShutdown.bind(this),
      onSignal: this.shutdownRequested.bind(this),
      onShutdown: this.shutdownDone.bind(this),
      onSendFailureDuringShutdown: this.shutdownFailed.bind(this),
      logger: this.logger.bind(this)
    }))
  }

  /**
   * Hook called before `listen()`.
   *
   * Will call:
   *   - {@link KubeInterface.load}
   *   - {@link Operator.initialize}
   *   - every {@link ResourceWatcher.watch}
   */
  async beforeListen() {
    await this.operator.kubectl.load()
    await this.operator.initialize()

    this.cancelScopes = await Promise.all(
      this.operator.watchers.map(
        async watcher => await watcher.watch(this.operator)
      )
    )
  }

  /**
   * Hook called before shutting down.
   * Will cancel the {@link ResourceWatcher} cancel scopes.
   */
  async beforeShutdown() {
    await Promise.all(
      this.cancelScopes.map(
        async cancelScope => await cancelScope.cancel()
      )
    )
  }

  /**
   * Hook called upon reception of a `SIGINT` or `SIGTERM` signal.
   */
  async shutdownRequested() {
    console.log('Shutdown requested')
  }

  /**
   * Hook called once shutdown workflow is done.
   *
   * Will call {@link Operator.terminate}
   */
  async shutdownDone() {
    await this.operator.terminate()
  }

  /**
   * Hook called if the shutdown workflow failed.
   */
  async shutdownFailed() {
    console.error('Shutdown failed')
  }

  /**
   * Hook called by `@godaddy/terminus` to log messages.
   *
   * @param msg Log message.
   * @param payload Extra informations to log.
   */
  async logger(msg: string, payload: any) {
    console.log(msg, payload)
  }

  /**
   * Will start the {@link ResourceWatcher} objects and the HTTP(S) servers.
   */
  async listen() {
    await this.beforeListen()

    return await Promise.all(
      this.servers.map(({ server, port }) =>
        new Promise((resolve, reject) => {
          server.listen(port)
            .once('listening', resolve)
            .once('error', reject)
        })
      )
    )
  }
}
