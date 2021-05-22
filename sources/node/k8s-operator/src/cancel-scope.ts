/**
 * A *Cancel Scope* encapsulate a closure that can be called later on.
 *
 * ```typescript
 * const { consumerTag } = await amqpChannel.consume(queue, handler)
 * const cancelScope = new CancelScope(async () => {
 *   await amqpChannel.cancel(consumerTag)
 * })
 * // later
 * await cancelScope.cancel()
 * ```
 *
 * @module cancel-scope
 */

/**
 * Encapsulate a closure inside an object.
 */
 export class CancelScope {
  #cleanup: () => Promise<void>

  /**
   * @param cleanup Closure to encapsulate.
   */
  constructor(cleanup: () => Promise<void>) {
    this.#cleanup = cleanup
  }

  /**
   * Calls the encapsulated closure.
   */
  async cancel() {
    await this.#cleanup()
  }
}
