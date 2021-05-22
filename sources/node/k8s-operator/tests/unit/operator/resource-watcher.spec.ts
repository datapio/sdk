import { describe, it } from 'mocha'
import { expect } from 'chai'

import { Operator, KubeInterface, ResourceWatcher } from '../../../src/index'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setUp, withWorld } = require('test!world')


class TestWatcher extends ResourceWatcher {
  constructor() {
    super({
      apiVersion: 'example.com/v1',
      kind: 'Example',
      namespace: 'default'
    })
  }

  async added(operator: Operator, object: any) {
    await super.added(operator, object)

    withWorld((world: any) => {
      world.watcher.added = true
    })
  }

  async modified(operator: Operator, object: any) {
    await super.modified(operator, object)

    withWorld((world: any) => {
      world.watcher.modified = true
    })
  }

  async deleted(operator: Operator, object: any) {
    await super.deleted(operator, object)

    withWorld((world: any) => {
      world.watcher.deleted = true
    })
  }
}

describe('ResourceWatcher', () => {
  beforeEach(setUp)

  it('should watch a resource being added', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    const watcher = new TestWatcher()
    const cancelScope = await watcher.watch(<Operator> { kubectl })

    withWorld((world: any) => {
      world.stream.push({ type: 'added', object: {} })
    })

    await 0 // breakpoint to let the promise execute
    cancelScope.cancel()

    withWorld((world: any) => {
      expect(world.watcher.added).to.be.true
    })
  })

  it('should watch a resource being modified', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    const watcher = new TestWatcher()
    const cancelScope = await watcher.watch(<Operator> { kubectl })

    withWorld((world: any) => {
      world.stream.push({ type: 'modified', object: {} })
    })

    await 0 // breakpoint to let the promise execute
    cancelScope.cancel()

    withWorld((world: any) => {
      expect(world.watcher.modified).to.be.true
    })
  })

  it('should watch a resource being deleted', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    const watcher = new TestWatcher()
    const cancelScope = await watcher.watch(<Operator> { kubectl })

    withWorld((world: any) => {
      world.stream.push({ type: 'deleted', object: {} })
    })

    await 0 // breakpoint to let the promise execute
    cancelScope.cancel()

    withWorld((world: any) => {
      expect(world.watcher.deleted).to.be.true
    })
  })
})
