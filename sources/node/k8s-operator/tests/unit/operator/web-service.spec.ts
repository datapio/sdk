import { describe, it } from 'mocha'
import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'
import * as sinon from 'sinon'

use(sinonChai)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setUp } = require('test!world')

import { Operator } from '../../../src/index'
import { ServerFactory } from '../../../src/operator/server-factory'
import { WebService } from '../../../src/operator/web-service'


import * as operatorStubs from '../../fixtures/operator'
import terminus from '@godaddy/terminus'

const operator = <Operator> <unknown> operatorStubs


describe('WebService', () => {
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
    setUp()

    console.log = mockedConsole.log
    console.error = mockedConsole.error
    console.warn = mockedConsole.warn

    const terminusStub = <any> terminus.createTerminus
    terminusStub.resetHistory()
  })

  afterEach(() => {
    console.log = consoleObject.log
    console.error = consoleObject.error
    console.warn = consoleObject.warn
  })

  it('should initialize the servers', () => {
    const serverFactory = new ServerFactory()
    const service = new WebService(operator, serverFactory)

    expect(service.servers).to.be.an('array').of.length(1)
    expect(terminus.createTerminus).to.have.been.calledOnce
  })

  it('should initialize the operator before starting', async () => {
    const serverFactory = new ServerFactory()
    const service = new WebService(operator, serverFactory)

    await service.beforeListen()

    expect(operator.kubectl.load).to.have.been.calledOnce
    expect(operator.initialize).to.have.been.calledOnce
    expect(service.cancelScopes).to.be.an('array').of.length(1)
  })

  it('should stop the watchers before shutdown', async () => {
    const serverFactory = new ServerFactory()
    const service = new WebService(operator, serverFactory)

    await service.beforeListen()
    await service.beforeShutdown()

    expect(service.cancelScopes[0].cancel).to.have.been.calledOnce
  })

  it('should log a message when a shutdown is requested', async () => {
    const serverFactory = new ServerFactory()
    const service = new WebService(operator, serverFactory)

    await service.shutdownRequested()

    expect(mockedConsole.log).to.have.been.calledOnce
  })

  it('should terminate the operator once it is shutdown', async () => {
    const serverFactory = new ServerFactory()
    const service = new WebService(operator, serverFactory)

    await service.shutdownDone()

    expect(operator.terminate).to.have.been.calledOnce
  })

  it('should log an error when an exception is thrown during shutdown', async () => {
    const serverFactory = new ServerFactory()
    const service = new WebService(operator, serverFactory)

    await service.shutdownFailed()

    expect(mockedConsole.error).to.have.been.calledOnce
  })

  it('should log messages sent by terminus', async () => {
    const serverFactory = new ServerFactory()
    const service = new WebService(operator, serverFactory)

    await service.logger('msg', 'payload')

    expect(mockedConsole.log).to.have.been.calledWith('msg', 'payload')
  })

  it('should listen on each server port', async () => {
    const serverFactory = new ServerFactory()
    const service = new WebService(operator, serverFactory)

    await service.listen()
  })
})
