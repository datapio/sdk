/**
 * An *Exchange* object provide an abstraction over the AMQP exchange
 * operations on an AMQP channel.
 *
 * ```typescript
 * const exchg = new Exchange(amqpChannel, 'my-exchange')
 * await exchg.check()
 * ```
 *
 * @module exchange
 */


import { Channel, Options } from 'amqplib'

/**
 * Abstraction over AMQP exchange operations on a {@link Channel}.
 */
export class Exchange {
  #channel: Channel
  #name: string

  /**
   * @param channel AMQP channel from [amqplib](https://www.npmjs.com/package/amqplib)
   * @param name Exchange name
   */
  constructor(channel: Channel, name: string) {
    this.#channel = channel
    this.#name = name
  }

  /**
   * Check that the exchange exists. If it doesn’t exist, the channel will be
   * closed with an error. If it does exist, happy days.
   *
   * Will call {@link Channel.checkExchange}.
   */
  async check(): Promise<void> {
    await this.#channel.checkExchange(this.#name)
  }

  /**
   * Delete this exchange.
   *
   * Will call {@link Channel.deleteExchange}.
   */
  async remove(options: Options.DeleteExchange): Promise<void> {
    await this.#channel.deleteExchange(this.#name, options)
  }

  /**
   * Bind an exchange to this exchange.
   *
   * Will call {@link Channel.bindExchange}.
   */
  async bind(source: string, pattern: string, args?: any): Promise<void> {
    await this.#channel.bindExchange(this.#name, source, pattern, args)
  }

  /**
   * Unind an exchange from this exchange.
   *
   * Will call {@link Channel.unbindExchange}.
   */
  async unbind(source: string, pattern: string, args?: any): Promise<void> {
    await this.#channel.unbindExchange(this.#name, source, pattern, args)
  }
}

/**
 * Named set of {@link Exchange}.
 */
export type Exchanges = {
  [exchangeName: string]: Exchange
}
