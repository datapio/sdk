/**
 * Default options for the {@link Operator} components.
 *
 * @module operator/options
 */

import express from 'express'
import crypto from 'crypto'

import * as t from './types'


const defaultHttpApiFactory = () =>
  (request: express.Request, response: express.Response) => {
    response.end('default backend')
  }


/**
 * Default options for {@link ServerFactory}.
 */
export const ServerFactory: t.ServerOptions = {
  https: {
    enabled: false,
    port: 8443,
    key: '/path/to/key.pem',
    cert: '/path/to/cert.pem',
    ca: '/path/to/ca.pem'
  },
  http: {
    enabled: true,
    port: 8000
  }
}

/**
 * Default options for {@link Operator}.
 */
export const Operator: t.OperatorOptions = {
  apiFactory: defaultHttpApiFactory,
  watchers: [],
  serverOptions: ServerFactory,
  kubeOptions: {},
  apolloOptions: {
    enabled: true,
    typeDefs: [],
    resolvers: {},
    context: () => ({})
  },
  corsOptions: {},
  cookieSecret: crypto.randomBytes(48).toString('hex'),
  authCookieName: 'X-Datapio-Auth-Token'
}
