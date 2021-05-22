/**
 * A *Queue* object provide an abstraction over the AMQP queue
 * operations on an AMQP channel.
 *
 * ```typescript
 * const queue = new Queue(amqpChannel, 'my-queue')
 * await queue.check()
 * ```
 *
 * @module queue
 */

import { Channel, Replies, Options } from 'amqplib'


/**
 * Abstraction over AMQP queue operations on a {@link Channel}.
 */
export class Queue {
  #channel: Channel
  #name: string

  /**
   * @param channel AMQP channel from [amqplib](https://www.npmjs.com/package/amqplib)
   * @param name Queue name
   */
  constructor(channel: Channel, name: string) {
    this.#channel = channel
    this.#name = name
  }

  /**
   * Check whether this queue exists.
   *
   * Will call {@link Channel.checkQueue}.
   */
  async check(): Promise<Replies.AssertQueue> {
    return await this.#channel.checkQueue(this.#name)
  }

  /**
   * Delete this queue.
   *
   * Will call {@link Channel.deleteQueue}.
   */
  async remove(options: Options.DeleteQueue): Promise<Replies.DeleteQueue> {
    return await this.#channel.deleteQueue(this.#name, options)
  }

  /**
   * Purge messages from this queue.
   *
   * Will call {@link Channel.purgeQueue}.
   */
  async purge(): Promise<Replies.PurgeQueue> {
    return await this.#channel.purgeQueue(this.#name)
  }

  /**
   * Route message from an exchange to this queue.
   *
   * Will call {@link Channel.bindQueue}.
   */
  async bind(source: string, pattern: string, args?: any): Promise<void> {
    await this.#channel.bindQueue(this.#name, source, pattern, args)
  }

  /**
   * Remove the route from an exchange to this queue.
   *
   * Will call {@link Channel.unbindQueue}.
   */
  async unbind(source: string, pattern: string, args?: any): Promise<void> {
    await this.#channel.unbindQueue(this.#name, source, pattern, args)
  }
}

/**
 * Named set of {@link Queue}.
 */
export type Queues = {
  [queueName: string]: Queue
}
