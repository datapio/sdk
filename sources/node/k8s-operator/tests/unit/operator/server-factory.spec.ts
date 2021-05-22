import { describe, it } from 'mocha'
import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'
import * as sinon from 'sinon'

use(sinonChai)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setUp } = require('test!world')

import { ServerFactory } from '../../../src/operator/server-factory'
import * as opts from '../../../src/operator/options'

import https from 'https'
import http from 'http'
import fs from 'fs'


describe('ServerFactory', () => {
  beforeEach(setUp)

  it('should use default options when none are provided', () => {
    const serverFactory = new ServerFactory()
    expect(serverFactory.getOptions()).to.deep.equal(opts.ServerFactory)
  })

  it('should override default options when custom options are provided', () => {
    const serverFactory = new ServerFactory({ https: { enabled: true } })
    expect(serverFactory.getOptions()).to.deep.equal({
      https: {
        enabled: true,
        port: 8443,
        key: '/path/to/key.pem',
        cert: '/path/to/cert.pem',
        ca: '/path/to/ca.pem'
      },
      http: {
        enabled: true,
        port: 8000
      }
    })
  })

  it('should create only an HTTP server when HTTPS is enabled', () => {
    const serverFactory = new ServerFactory()
    const api = sinon.spy()

    const servers = serverFactory.make(<any> api)

    expect(servers).to.be.an('array').of.length(1)
    expect(servers[0]).to.be.an('object')
    expect(servers[0].port).to.equal(8000)

    expect(http.createServer).to.have.been.calledWith(api)
  })

  it('should create an HTTP and an HTTPS server when HTTPS is enabled', () => {
    const serverFactory = new ServerFactory({ https: { enabled: true }})
    const api = sinon.spy()

    const servers = serverFactory.make(<any> api)

    expect(servers).to.be.an('array').of.length(2)
    expect(servers[0]).to.be.an('object')
    expect(servers[0].port).to.equal(8000)

    expect(servers[1]).to.be.an('object')
    expect(servers[1].port).to.equal(8443)

    expect(http.createServer).to.have.been.calledWith(api)
    expect(https.createServer).to.have.been.calledWith({
      key: 'DATA',
      cert: 'DATA',
      ca: 'DATA'
    }, api)
    expect(fs.readFileSync).to.have.been.calledWith('/path/to/key.pem')
    expect(fs.readFileSync).to.have.been.calledWith('/path/to/cert.pem')
    expect(fs.readFileSync).to.have.been.calledWith('/path/to/ca.pem')
  })

  it('should create an HTTPS server when HTTPS is enabled but HTTP is disabled', () => {
    const serverFactory = new ServerFactory({
      https: { enabled: true },
      http: { enabled: false }
    })
    const api = sinon.spy()
    const servers = serverFactory.make(<any> api)

    expect(servers).to.be.an('array').of.length(1)
    expect(servers[0]).to.be.an('object')
    expect(servers[0].port).to.equal(8443)

    expect(https.createServer).to.have.been.calledWith({
      key: 'DATA',
      cert: 'DATA',
      ca: 'DATA'
    }, api)
    expect(fs.readFileSync).to.have.been.calledWith('/path/to/key.pem')
    expect(fs.readFileSync).to.have.been.calledWith('/path/to/cert.pem')
    expect(fs.readFileSync).to.have.been.calledWith('/path/to/ca.pem')
  })

  it('should throw an error when both HTTP and HTTPS are disabled', () => {
    const serverFactory = new ServerFactory({
      https: { enabled: false },
      http: { enabled: false }
    })
    const api = sinon.spy()

    try {
      serverFactory.make(<any> api)
      throw new Error('no error thrown')
    }
    catch (err) {
      expect(err.name).to.equal('OperatorError')
    }
  })
})
