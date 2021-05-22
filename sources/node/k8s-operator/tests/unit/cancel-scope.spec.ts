import { describe, it } from 'mocha'
import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'
import * as sinon from 'sinon'

use(sinonChai)

import { CancelScope } from '../../src/cancel-scope'

describe('CancelScope', () => {
  it('should execute the closure', async () => {
    const closure = sinon.stub().resolves()
    const cancelScope = new CancelScope(closure)
    await cancelScope.cancel()

    expect(closure).to.have.been.calledOnce
  })

  it('should not catch errors', async () => {
    const closure = sinon.stub().rejects(new Error('error'))
    const cancelScope = new CancelScope(closure)

    try {
      await cancelScope.cancel()
    }
    catch (err) {
      expect(err).to.be.an('Error')
      expect(err.message).to.equal('error')
    }
  })
})
