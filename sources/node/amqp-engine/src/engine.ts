/**
 * Abstraction over [amqplib](https://www.npmjs.com/package/amqplib) to provide
 * a declarative way of defining exchanges, queues, publishers and consumers.
 *
 * @module engine
 */

import mergeOptions from 'merge-options'
import amqp from 'amqplib'

import { CancelScope } from './cancel-scope'
import { Exchange, Exchanges } from './exchange'
import { Queue, Queues } from './queue'
import * as opts from './options'
import { DefaultOptions } from './options'


const encode = (msg: any) => Buffer.from(JSON.stringify(msg))

/**
 * AMQP Engine
 */
export class Engine {
  #options: opts.EngineOptions

  #conn: null | amqp.Connection
  #channel: null | amqp.Channel
  #exchanges: Exchanges
  #queues: Queues

  #publishers: opts.PublisherHandlers
  #cancelScopes: CancelScope[]

  /**
   * @param options Engine configuration
   */
  constructor(options?: Partial<opts.EngineOptions>) {
    this.#options = mergeOptions(DefaultOptions.Engine, options || {})

    this.#conn = null
    this.#channel = null

    this.#exchanges = {}
    this.#queues = {}
    this.#publishers = {}

    this.#cancelScopes = []
  }

  /**
   * Declares {@link Exchange}s and {@link Queue}s, and generates publisher
   * functions (see {@link PublisherHandlers}).
   *
   * Blocks until everything is set-up.
   *
   * Calls {@link Engine.afterDeclare}.
   */
  async declare(): Promise<void> {
    this.#conn = await amqp.connect(this.#options.url)
    this.#channel = await this.#conn!.createChannel()

    // create exchanges
    this.#exchanges = Object.fromEntries(
      await Promise.all(
        Object.entries(this.#options.exchanges).map(async ([name, config]) => {
          const { type, options }: opts.ExchangeOptions = mergeOptions(DefaultOptions.Exchange, config)
          await this.#channel!.assertExchange(name, type, options)

          return [name, new Exchange(this.#channel!, name)]
        })
      )
    )

    // create queues
    this.#queues = Object.fromEntries(
      await Promise.all(
        Object.entries(this.#options.queues).map(async ([name, config]) => {
          const { bindings, options }: opts.QueueOptions = mergeOptions(DefaultOptions.Queue, config)
          await this.#channel!.assertQueue(name, options)

          // bind queues
          await Promise.all(
            bindings.map(async binding => {
              const { exchange, routingKey }: opts.QueueBinding = mergeOptions(
                DefaultOptions.QueueBinding,
                binding
              )

              await this.#channel!.bindQueue(name, exchange, routingKey)
            })
          )

          return [name, new Queue(this.#channel!, name)]
        })
      )
    )

    // create publishers
    this.#publishers = Object.fromEntries(
      Object.entries(this.#options.publishers).map(([name, config]) => {
        return [
          name,
          ({ message, props }: opts.AMQPEvent) => {
            if ('queue' in config) {
              this.#channel!.sendToQueue(
                config.queue,
                encode(message),
                props
              )
            }
            else {
              this.#channel!.publish(
                config.exchange,
                config.routingKey,
                encode(message),
                props
              )
            }
          }
        ]
      })
    )

    await this.afterDeclare()
  }

  /**
   * Start consumers.
   *
   * Will block until all consumers are started then returns.
   *
   * Calls {@link Engine.beforeConsume}.
   */
  async consume() {
    await this.beforeConsume()

    this.#cancelScopes = await Promise.all(
      Object.entries(this.#options.consumers).map(async ([queue, handler]) => {
        const { consumerTag } = await this.#channel!.consume(
          queue,
          async message => {
            const event = JSON.parse(message!.content.toString('utf-8'))

            try {
              await handler(this.getPublishers(), event)
              this.#channel!.ack(message!)
            }
            catch (err) {
              console.error('Error:', err)
              this.#channel!.nack(message!)
            }
          }
        )

        return new CancelScope(async () => {
          await this.#channel!.cancel(consumerTag)
        })
      })
    )
  }

  /**
   * Cancel consumers and close channel.
   *
   * Will block until all consumers are stoped and the AMQP channel and
   * connection are closed.
   *
   * Calls {@link Engine.beforeShutdown}.
   */
  async shutdown() {
    await this.beforeShutdown()

    await Promise.all(
      this.#cancelScopes.map(
        async cancelScope => await cancelScope.cancel()
      )
    )

    this.#cancelScopes = []

    await this.#channel!.close()
    await this.#conn!.close()

    this.#channel = null
    this.#conn = null
  }

  /** Get a copy of the engine's configuration */
  getOptions(): opts.EngineOptions {
    return mergeOptions({}, this.#options)
  }

  /** Get the {@link Exchange} object by name */
  getExchange(name: string): Exchange {
    return this.#exchanges[name]
  }

  /** Get the {@link Queue} object by name */
  getQueue(name: string): Queue {
    return this.#queues[name]
  }

  /** Get a copy of the publisher handlers */
  getPublishers(): opts.PublisherHandlers {
    return mergeOptions({}, this.#publishers)
  }

  /**
   * Hook called after the AMQP architecture has been declared.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async afterDeclare(): Promise<void> {}

  /**
   * Hook called before consumers are started.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async beforeConsume(): Promise<void> {}

  /**
   * Hook called before shuting down consumers.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async beforeShutdown(): Promise<void> {}
}
