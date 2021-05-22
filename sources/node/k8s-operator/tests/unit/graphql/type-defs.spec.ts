import { describe, it } from 'mocha'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'

use(chaiAsPromised)


describe('graphql/type-defs', () => {
  it('should be required successfuly', () => {
    const promise = import('../../../src/graphql/type-defs/index')
    expect(promise).to.be.fulfilled
  })
})
