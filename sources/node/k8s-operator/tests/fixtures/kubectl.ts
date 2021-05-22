import { KubeConfig } from '@kubernetes/client-node'
import sinon from 'sinon'

export const config = new KubeConfig()

config.addCluster({
  name: 'test-cluster',
  server: 'http://test-server',
  skipTLSVerify: true
})
config.addUser({
  name: 'test-user',
  token: 'test-token'
})
config.addContext({
  cluster: 'test-cluster',
  name: 'test-context',
  user: 'test-user',
  namespace: 'default'
})
config.setCurrentContext('test-context')

export const load = sinon.stub().resolves()

export default { config, load }
