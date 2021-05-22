/**
 * Abstraction over the `http` and `https` modules.
 *
 * @module operator/server-factory
 */

import mergeOptions from 'merge-options'
import express from 'express'
import https from 'https'
import http from 'http'
import fs from 'fs'

import { OperatorError } from '../errors'

import * as t from './types'
import * as o from './options'


/**
 * Generate HTTP(S) servers.
 */
export class ServerFactory {
  #options: t.ServerOptions

  /**
   * @param options HTTP(S) servers configuration.
   */
  constructor(options: t.RecursivePartial<t.ServerOptions> = {}) {
    this.#options = mergeOptions(o.ServerFactory, options)
  }

  /**
   * @returns a copy of the {@link ServerFactory} options.
   */
  getOptions(): t.ServerOptions {
    return mergeOptions({}, this.#options)
  }

  /**
   * Encapsulate an express Application in HTTP(S) servers.
   *
   * @param api Express Application.
   * @returns List of HTTP(S) servers.
   */
  make(api: express.Application): t.ServerList {
    const servers = []

    if (this.#options.http.enabled) {
      servers.push({
        server: http.createServer(api),
        port: this.#options.http.port
      })
    }

    if (this.#options.https.enabled) {
      servers.push({
        server: https.createServer(
          {
            key: fs.readFileSync(this.#options.https.key),
            cert: fs.readFileSync(this.#options.https.cert),
            ca: fs.readFileSync(this.#options.https.ca)
          },
          api
        ),
        port: this.#options.https.port
      })
    }

    if (servers.length === 0) {
      throw new OperatorError('No server configured')
    }

    return servers
  }
}
