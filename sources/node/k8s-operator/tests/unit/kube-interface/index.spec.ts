import { describe, it } from 'mocha'
import { expect, use } from 'chai'
import sinonChai from 'sinon-chai'

use(sinonChai)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setUp } = require('test!world')

import createTestSuite from './create'
import listTestSuite from './list'
import getTestSuite from './get'
import watchTestSuite from './watch'
import patchTestSuite from './patch'
import replaceTestSuite from './replace'
import deleteTestSuite from './delete'
import logsTestSuite from './logs'
import execTestSuite from './exec'

import { KubeInterface } from '../../../src/index'


describe('KubeInterface', () => {
  beforeEach(setUp)

  it('should create a client and load the server API specification', async () => {
    const kubectl = new KubeInterface({ crds: [
      {
        metadata: {
          name: 'crd-foo'
        }
      }
    ]})
    await kubectl.load()

    expect(kubectl.client.loadSpec).to.have.been.calledOnce

    expect(kubectl.client.addCustomResourceDefinition).to.have.been.calledWith(
      { metadata: { name: 'crd1' }}
    )
    expect(kubectl.client.addCustomResourceDefinition).to.have.been.calledWith(
      { metadata: { name: 'crd2' }}
    )
    expect(kubectl.client.addCustomResourceDefinition).to.have.been.calledWith(
      { metadata: { name: 'crd-foo' }}
    )
  })

  describe('create', createTestSuite)
  describe('list', listTestSuite)
  describe('get', getTestSuite)
  describe('watch', watchTestSuite)
  describe('patch', patchTestSuite)
  describe('replace', replaceTestSuite)
  describe('delete', deleteTestSuite)
  describe('logs', logsTestSuite)
  describe('exec', execTestSuite)
})
