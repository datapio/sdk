/**
 * Abstraction over {@link KubeInterface.watch}.
 *
 * @module operator/resource-watcher
 */

import { CancelScope } from '../cancel-scope'
import { Watch, Resource } from '../kube-interface/types'
import { Operator } from './index'


type WatchEvent = {
  type: 'ADDED' | 'MODIFIED' | 'DELETED',
  object: Resource
}

/**
 * Define the Kubernetes resources to watch.
 */
export class ResourceWatcher {
  #meta: Watch

  /**
   * @param __namedParameters Metadata of the resources to watch.
   */
  constructor({ apiVersion, kind, namespace, name }: Watch) {
    this.#meta = {
      apiVersion,
      kind,
      namespace,
      name
    }
  }

  /**
   * Start watching the described resources.
   *
   * @param operator {@link Operator} owning the {@link ResourceWatcher}.
   * @returns a {@link CancelScope} for the watcher.
   */
  async watch(operator: Operator) {
    const context = {
      stream: await operator.kubectl.watch(this.#meta),
      restart: true
    }
    const handlers = {
      added: this.added.bind(this),
      modified: this.modified.bind(this),
      deleted: this.deleted.bind(this)
    }

    const callHandler = async ({ type, object }: WatchEvent) => {
      const handler = handlers[<'added' | 'modified' | 'deleted'> type.toLowerCase()]
      await handler(operator, object)
    }

    const errorHandler = async (error: Error) => {
      await this.errored(operator, error)
      context.stream.end()
    }

    const restartHandler = async () => {
      if (context.restart) {
        context.stream = await operator.kubectl.watch(this.#meta)
        context.stream.on('data', callHandler)
        context.stream.on('end', restartHandler)
        context.stream.on('error', errorHandler)
      }
    }

    context.stream.on('data', callHandler)
    context.stream.on('end', restartHandler)
    context.stream.on('error', errorHandler)

    return new CancelScope(async () => {
      context.restart = false
      context.stream.end()
    })
  }

  /**
   * Hook called whenever an `ADDED` event is received.
   *
   * @param operator {@link Operator} owning the {@link ResourceWatcher}.
   * @param object Added Kubernetes Resource.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
  async added(operator: Operator, object: Resource) {}

  /**
   * Hook called whenever a `MODIFIED` event is received.
   *
   * @param operator {@link Operator} owning the {@link ResourceWatcher}.
   * @param object Modified Kubernetes Resource.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
  async modified(operator: Operator, object: Resource) {}

  /**
   * Hook called whenever a `DELETED` event is received.
   *
   * @param operator {@link Operator} owning the {@link ResourceWatcher}.
   * @param object Deleted Kubernetes Resource.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
  async deleted(operator: Operator, object: Resource) {}

  /**
   * Hook called whenever an error has been received.
   *
   * @param operator {@link Operator} owning the {@link ResourceWatcher}.
   * @param error The error that was thrown.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
  async errored(operator: Operator, error: Error) {}
}
