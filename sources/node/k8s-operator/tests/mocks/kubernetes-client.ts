import sinon from 'sinon'

export { KubeConfig } from '@kubernetes/client-node'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withWorld } = require('test!world')


const makeNamed = (vtable: any, namedVtable?: any) => {
  const named = <any> (() => {
    return typeof namedVtable === 'undefined'
      ? vtable
      : namedVtable
  })

  Object.entries(vtable).map(([name, method]) => {
    named[name] = method
  })

  return named
}

const example = makeNamed(
  {
    get: sinon.stub().resolves({ statusCode: 200, body: { items: ['DATA', 'DATA'] } }),
    post: sinon.stub().resolves({ statusCode: 200, body: 'DATA' })
  },
  {
    get: sinon.stub().resolves({ statusCode: 200, body: 'DATA' }),
    patch: sinon.stub().resolves({ statusCode: 200, body: 'DATA' }),
    put: sinon.stub().resolves({ statusCode: 200, body: 'DATA' }),
    delete: sinon.stub().resolves({ statusCode: 200, body: 'DATA' }),
    exec: {
      post: sinon.stub().resolves({ statusCode: 200, body: 'DATA' })
    },
    log: {
      get: sinon.stub().resolves({ statusCode: 200, body: 'DATA' })
    }
  }
)

const watchExample = makeNamed({
  getObjectStream: sinon.stub().callsFake(
    async () => withWorld((world: any) => world.stream)
  )
})

const failure = makeNamed(
  {
    get: sinon.stub().resolves({ statusCode: 404, body: 'ERROR' }),
    post: sinon.stub().resolves({ statusCode: 404, body: 'ERROR' })
  },
  {
    get: sinon.stub().resolves({ statusCode: 404, body: 'ERROR' }),
    patch: sinon.stub().resolves({ statusCode: 404, body: 'ERROR' }),
    put: sinon.stub().resolves({ statusCode: 404, body: 'ERROR' }),
    delete: sinon.stub().resolves({ statusCode: 404, body: 'ERROR' }),
    exec: {
      post: sinon.stub().resolves({ statusCode: 404, body: 'ERROR' })
    },
    log: {
      get: sinon.stub().resolves({ statusCode: 404, body: 'ERROR' })
    }
  }
)

const customresourcedefinitions = makeNamed(
  {
    get: sinon.stub().resolves({ statusCode: 200, body: { items: [
      {
        metadata: {
          name: 'crd1'
        }
      },
      {
        metadata: {
          name: 'crd2'
        }
      }
    ] }}),
    post: sinon.stub().resolves({ statusCode: 200, body: 'DATA' })
  },
  {}
)

const apis = {
  'apiextensions.k8s.io': {
    'v1beta1': {
      customresourcedefinitions
    }
  },
  'example.com': {
    'v1': {
      watch: {
        namespaces: sinon.stub().returns({
          example: watchExample
        }),
        example: watchExample,
      },
      namespaces: sinon.stub().callsFake(ns => ({
        example,
        pod: ns === 'example' ? example : failure,
        failure
      })),
      example,
      failure
    }
  }
}

export class Client {
  loadSpec: any
  apis: any
  api: any
  addCustomResourceDefinition: any

  constructor() {
    this.loadSpec = sinon.stub().resolves()
    this.apis = apis
    this.api = apis['example.com']
    this.addCustomResourceDefinition = sinon.stub()
  }
}
