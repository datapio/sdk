import { describe, it, beforeEach, afterEach } from 'mocha'
import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'
import * as sinon from 'sinon'

use(sinonChai)

import { Engine } from '../../src/index'
import { DefaultOptions } from '../../src/options'

import * as amqplibStubs from '../mocks/amqp'
import amqplibMock from '../mocks/amqp'


describe('Engine', () => {
  const consoleObject = {
    log: console.log,
    error: console.error,
    warn: console.warn
  }

  const mockedConsole = {
    log: sinon.stub(),
    error: sinon.stub(),
    warn: sinon.stub()
  }

  beforeEach(() => {
    console.log = mockedConsole.log
    console.error = mockedConsole.error
    console.warn = mockedConsole.warn
  })

  afterEach(() => {
    console.log = consoleObject.log
    console.error = consoleObject.error
    console.warn = consoleObject.warn
  })

  it('should have a default configuration', () => {
    const engine = new Engine()

    expect(engine.getOptions()).to.deep.equal(DefaultOptions.Engine)
  })

  it('should declare the exchanges and queues', async () => {
    const engine = new Engine({
      exchanges: {
        'test-exchange': {
          type: 'topic',
          options: {
            durable: true
          }
        }
      },
      queues: {
        'test-queue': {
          bindings: [
            {
              exchange: 'test-exchange',
              routingKey: '#'
            }
          ],
          options: {
            durable: true
          }
        }
      }
    })

    await engine.declare()

    expect(amqplibMock.connect).to.have.been.calledOnce
    expect(amqplibStubs.conn.createChannel).to.have.been.calledOnce
    expect(amqplibStubs.channel.assertExchange).to.have.been.calledWith(
      'test-exchange',
      'topic',
      { durable: true }
    )
  })

  it('should create publishers', async () => {
    const engine = new Engine({
      publishers: {
        'queue_example': {
          queue: 'example'
        },
        'exchange_example': {
          exchange: 'example',
          routingKey: 'example'
        }
      }
    })

    await engine.declare()

    const { queue_example, exchange_example } = engine.getPublishers()

    await queue_example({
      message: 'HELLO',
      props: {}
    })
    await exchange_example({
      message: 'WORLD',
      props: {}
    })

    const msgA = Buffer.from(JSON.stringify('HELLO'))
    const msgB = Buffer.from(JSON.stringify('WORLD'))

    expect(amqplibStubs.channel.sendToQueue).to.have.been.calledWith('example', msgA, {})
    expect(amqplibStubs.channel.publish).to.have.been.calledWith('example', 'example', msgB, {})
  })

  it('should consume messages', async () => {
    const flags = { consumed: false }
    const engine = new Engine({
      consumers: {
        'queue-example': async (publishers, event) => {
          expect(publishers).to.deep.equal(engine.getPublishers())
          expect(event).to.equal('DATA')
          flags.consumed = true
        }
      }
    })

    await engine.declare()
    await engine.consume()

    expect(amqplibStubs.channel.consume).to.have.been.called

    const args = amqplibStubs.channel.consume.args
    const [ queue, handler ] = args[args.length - 1]

    expect(queue).to.equal('queue-example')

    const msg = {
      content: Buffer.from(JSON.stringify('DATA'))
    }
    await handler(msg)

    expect(flags.consumed).to.be.true
    expect(amqplibStubs.channel.ack).to.have.been.calledWith(msg)
  })

  it('should catch consumer errors', async () => {
    const err = new Error('error')
    const flags = { consumed: false }
    const engine = new Engine({
      consumers: {
        'queue-example': async (publishers, event) => {
          expect(publishers).to.deep.equal(engine.getPublishers())
          expect(event).to.equal('DATA')
          flags.consumed = true
          throw err
        }
      }
    })

    await engine.declare()
    await engine.consume()

    expect(amqplibStubs.channel.consume).to.have.been.called
    const args = amqplibStubs.channel.consume.args
    const [ queue, handler ] = args[args.length - 1]

    expect(queue).to.equal('queue-example')

    const msg = {
      content: Buffer.from(JSON.stringify('DATA'))
    }
    await handler(msg)

    expect(flags.consumed)
    expect(mockedConsole.error).to.have.been.calledWith('Error:', err)
    expect(amqplibStubs.channel.nack).to.have.been.calledWith(msg)
  })

  it('should cancel the consumers on shutdown', async () => {
    const engine = new Engine({
      consumers: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        'queue-example': async () => {}
      }
    })

    await engine.declare()
    await engine.consume()
    await engine.shutdown()

    expect(amqplibStubs.channel.cancel).to.have.been.calledWith('tag')
    expect(amqplibStubs.channel.close).to.have.been.called
    expect(amqplibStubs.conn.close).to.have.been.called
  })
})
