import { it } from 'mocha'
import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'
import * as sinon from 'sinon'

use(sinonChai)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withWorld } = require('test!world')

import { KubeInterface } from '../../../src/index'


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


export default () => {
  it('should watch resources', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    const stream = await kubectl.watch({
      apiVersion: 'example.com/v1',
      kind: 'Example',
      namespace: 'default',
      name: 'example'
    })

    const tag = { done: false }
    stream.on('data', (payload: any) => {
      expect(payload).to.equal('DATA')
      tag.done = true
    })

    withWorld((world: any) => {
      world.stream.push('DATA')
    })

    stream.end()

    expect(tag.done).to.be.true
  })

  it('should wait for a condition to be true', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    const callback = sinon.stub().callsFake(async object => ({
      condition: object === 'DATA',
      res: 'RESULT'
    }))

    const p = kubectl.waitCondition({
      apiVersion: 'example.com/v1',
      kind: 'Example',
      namespace: 'default',
      name: 'example',
      callback
    })

    await sleep(100) // breakpoint to let the promise execute

    withWorld((world: any) => {
      world.stream.push({ object: null })
      world.stream.push({ object: 'DATA' })
    })

    const result = await p

    expect(result).to.equal('RESULT')
    sinon.assert.calledWith(callback, null)
    sinon.assert.calledWith(callback, 'DATA')
  })

  it('should wait until an event is received if no callback is set', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    const p = kubectl.waitCondition({
      apiVersion: 'example.com/v1',
      kind: 'Example',
      namespace: 'default',
      name: 'example'
    })

    await sleep(100) // breakpoint to let the promise execute

    withWorld((world: any) => {
      world.stream.push({ object: 'DATA' })
    })

    const result = await p

    expect(result).to.be.null
  })

  it('should throw an error if the callback failed while waiting for a condition to be true', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    const callback = sinon.stub().callsFake(async () => {
      throw new Error('ERROR')
    })

    const p = kubectl.waitCondition({
      apiVersion: 'example.com/v1',
      kind: 'Example',
      namespace: 'default',
      name: 'example',
      callback
    })

    await sleep(100) // breakpoint to let the promise execute

    withWorld((world: any) => {
      world.stream.push({ object: 'DATA' })
    })

    try {
      await p
      throw new Error('no error has been thrown')
    }
    catch (err) {
      expect(err.message).to.equal('ERROR')
    }
  })
}
