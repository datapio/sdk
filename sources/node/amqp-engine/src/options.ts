/**
 * Define the {@link Engine}'s configuration and its defaults.
 *
 * @module options
 */

import { Options } from 'amqplib'

/**
 * Engine configuration
 */
export type EngineOptions = {
  /** AMQP broker URL */
  url: string,
  /** Set of exchanges to configure */
  exchanges: {
    [exchangeName: string]: ExchangeOptions
  },
  /** Set of queues to configure */
  queues: {
    [queueName: string]: QueueOptions
  },
  /** Set of publishers to configure */
  publishers: {
    [publisherName: string]: PublisherOptions
  },
  /** Set of consumers to setup */
  consumers: {
    [queueName: string]: ConsumerHandler
  }
}

/** {@link Exchange} configuration */
export type ExchangeOptions = {
  /** AMQP exchange type */
  type: 'topic' | 'fanout' | 'direct',
  /** AMQP exchange options */
  options: Options.AssertExchange
}

/** {@link Queue} configuration */
export type QueueOptions = {
  /** Routes to setup */
  bindings: QueueBinding[],
  /** AMQP queue options */
  options: Options.AssertQueue
}

/** Route from an exchange to a queue */
export type QueueBinding = {
  /** AMQP exchange's name (should be declared by an {@link ExchangeOptions} structure) */
  exchange: string,
  /** Routing Key to use to route messages from the exchange */
  routingKey: string
}

/**
 * Publisher configuration.
 * A publisher can publish message to an exchange or directly to a queue.
 */
export type PublisherOptions = QueuePublisherOptions | ExchangePublisherOptions

/** Queue Publisher configuration */
export type QueuePublisherOptions = {
  /** AMQP queue name (should be declared by a {@link QueueOptions} structure) */
  queue: string
}

/** Exchange Publisher configuration */
export type ExchangePublisherOptions = {
  /** AMQP exchange's name (should be declared by an {@link ExchangeOptions} structure) */
  exchange: string,
  /** Routing Key to use for later routing */
  routingKey: string
}

/** Set of generated publisher functions */
export type PublisherHandlers = {
  /**
   * @param event AMQP event to publish to the queue or exchange.
   */
  [publisherName: string]: (event: AMQPEvent) => void
}

/** AMQP event to send */
export type AMQPEvent = {
  /** Message to send */
  message: any,
  /** Options for the message (like expiration date, ...) */
  props?: Options.Publish
}

/**
 * Consumer function called for each received message.
 * If the function succeeds, the the message will be acknowleged with {@link Channel.ack},
 * otherwise it will be rejected with {@link Channel.nack}.
 *
 */
export type ConsumerHandler =
  /**
   * @param publishers Set of generated publisher.
   * @param message Received message.
   */
  (publishers: PublisherHandlers, message: any) => Promise<void>

export type DefaultConfig = {
  Engine: EngineOptions,
  Exchange: ExchangeOptions,
  Queue: QueueOptions,
  QueueBinding: QueueBinding
}

/** Default configuration options */
export const DefaultOptions: DefaultConfig = {
  Engine: {
    url: 'amqp://guest:guest@localhost:5672/',
    exchanges: {},
    queues: {},
    publishers: {},
    consumers: {}
  },
  Exchange: {
    type: 'topic',
    options: {
      durable: false
    }
  },
  Queue: {
    bindings: [],
    options: {
      durable: false
    }
  },
  QueueBinding: {
    exchange: 'default',
    routingKey: '#'
  }
}
