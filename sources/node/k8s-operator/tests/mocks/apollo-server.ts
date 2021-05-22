import sinon from 'sinon'

const applyMiddleware = sinon.stub()

export class ApolloServer {
  applyMiddleware: typeof applyMiddleware

  constructor() {
    this.applyMiddleware = applyMiddleware
  }
}

export const stubs = { applyMiddleware }
export const gql = sinon.stub()
