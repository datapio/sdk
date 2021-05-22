export * as kubectl from './kubectl'
import sinon from 'sinon'

export const webapp = <any> sinon.spy()
webapp.get = sinon.stub()

export const healthCheck = sinon.stub().resolves(true)
export const metrics = sinon.stub().resolves({})
export const initialize = sinon.stub().resolves()
export const terminate = sinon.stub().resolves()
export const watchers = [
  {
    watch: sinon.stub().resolves({ cancel: sinon.stub() })
  }
]
