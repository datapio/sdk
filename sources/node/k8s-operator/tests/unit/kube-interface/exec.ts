import { it } from 'mocha'
import { expect } from 'chai'

import { KubeInterface } from '../../../src/index'


export default () => {
  it('should execute a command inside a pod', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    const logs = await kubectl.exec({
      name: 'mypod',
      namespace: 'example',
      container: 'main',
      command: ['ls', '-l']
    })

    expect(logs).to.equal('DATA')
  })

  it('should throw an error if the command failed', async () => {
    const kubectl = new KubeInterface({})
    await kubectl.load()

    try {
      await kubectl.exec({
        namespace: 'failure',
        name: 'mypod',
        container: 'main',
        command: ['ls', '-l']
      })

      throw new Error('no error has been thrown')
    }
    catch (err) {
      expect(err.name).to.equal('KubeError')
      expect(err.details.resp.statusCode).to.equal(404)
      expect(err.details.resp.body).to.equal('ERROR')
    }
  })
}
