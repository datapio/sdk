import { describe, it } from 'mocha'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
import * as sinon from 'sinon'

use(sinonChai)
use(chaiAsPromised)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setUp } = require('test!world')

import casual from 'casual'

import { Operator, OperatorError } from '../../../src/index'
import kubeFixture from '../../fixtures/kubectl'

describe('Operator', () => {
  beforeEach(setUp)

  it('should create a Web service', () => {
    const operator = new Operator({})

    expect(operator.service.operator).to.be.equal(operator)
  })

  it('should call overloaded callbacks', async () => {
    const operator = new Operator({})

    await operator.initialize()
    await operator.terminate()
  })

  it('should have a default healthcheck returning true', async () => {
    const operator = new Operator({})

    expect(await operator.healthCheck()).to.be.true
  })

  it('should have a default metrics handler returning nothing', async () => {
    const operator = new Operator({})

    expect(await operator.metrics()).to.be.deep.equal({})
  })

  it('should have a default HTTP backend mounted on /api', async () => {
    const request = sinon.spy()
    const response = {
      end: sinon.stub()
    }

    const operator = new Operator({})

    expect(operator.webapp.use).to.have.been.calledWith('/api', operator.api)

    operator.api(<any> request, <any> response, () => [])
    expect(response.end).to.have.been.calledWith('default backend')
  })

  describe('ApolloServer', () => {
    it('should have a new KubeInterface per authenticated request with auth header', async () => {
      const expectedFoo = casual.word
      const context = sinon.stub().resolves({foo: expectedFoo})
      const operator = new Operator({
        apolloOptions: { context: <any> context },
        kubeOptions: {
          config: <any> kubeFixture.config
        }
      })

      const expectedToken = casual.word
      const req = {
        get: sinon.stub().returns(`Bearer ${expectedToken}`)
      }
      const res = {
        setHeader: sinon.stub()
      }

      const contextFun = <any> operator.options.apolloOptions.context
      const result = await contextFun({ req, res })
      expect(context).to.have.been.calledOnce
      expect(req.get).to.have.been.calledWith('authorization')
      expect(res.setHeader).to.have.been.calledWith('Set-Cookie')

      expect(result.foo).to.equal(expectedFoo)
      const { token } = result.kubectl.config.getCurrentUser()
      expect(token).to.equal(expectedToken)
    })

    it('should have a new KubeInterface per authenticated request with auth cookie', async () => {
      const expectedFoo = casual.word
      const context = sinon.stub().resolves({foo: expectedFoo})

      const authCookieName = 'X-Datapio-Auth-Token-Test'

      const operator = new Operator({
        apolloOptions: { context: <any> context },
        kubeOptions: {
          config: <any> kubeFixture.config
        },
        authCookieName: <any> authCookieName
      })

      const expectedToken = casual.word
      const req = {
        get: sinon.stub(),
        signedCookies: {
          [authCookieName]: expectedToken
        }
      }
      const res = {
        setHeader: sinon.stub()
      }

      const contextFun = <any> operator.options.apolloOptions.context
      const result = await contextFun({ req, res })
      expect(context).to.have.been.calledOnce
      expect(req.get).to.have.been.calledWith('authorization')
      expect(res.setHeader).to.have.been.calledWith('Set-Cookie')

      expect(result.foo).to.equal(expectedFoo)
      const { token } = result.kubectl.config.getCurrentUser()
      expect(token).to.equal(expectedToken)
    })

    it('should fail if no Bearer token nor auth cookie is provided', () => {
      const operator = new Operator({
        kubeOptions: {
          config: <any> kubeFixture.config
        }
      })
      const req = {
        get: sinon.stub(),
        signedCookies: {}
      }

      const contextFun = <any> operator.options.apolloOptions.context
      const promise = contextFun({ req })
      expect(promise).to.be.rejectedWith(OperatorError)
    })

    it('should fail if malformed Authorization header token is provided', () => {
      const operator = new Operator({
        kubeOptions: {
          config: <any> kubeFixture.config
        }
      })
      const req = {
        get: sinon.stub().returnsArg(0)
      }

      const contextFun = <any> operator.options.apolloOptions.context
      const promise = contextFun({ req })
      expect(promise).to.be.rejectedWith(OperatorError)
    })
  })
})
