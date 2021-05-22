/**
 * Type definitions for the {@link operator} module.
 *
 * @module operator/types
 */

import { KubeInterfaceOptions } from '../kube-interface/types'
import { KubeInterface } from '../kube-interface'

import { ResourceWatcher } from './resource-watcher'

import { ApolloServerExpressConfig } from 'apollo-server-express'
import { CorsOptions } from 'cors'
import express from 'express'
import https from 'https'
import http from 'http'


/**
 * Make all (nested) fields in a type optional.
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

/**
 * {@link Operator} configuration.
 */
export type OperatorOptions = {
  /** Returns a custom HTTP API capable of interacting with the Kubernetes API Server. */
  apiFactory: (kubectl: KubeInterface) => express.RequestHandler,
  /** List of {@link ResourceWatcher}. */
  watchers: ResourceWatcher[],
  /** Configuration for {@link ServerFactory}. */
  serverOptions: ServerOptions,
  /** Configuration for {@link KubeInterface}. */
  kubeOptions: KubeInterfaceOptions,
  /** Configuration for ApolloServer. */
  apolloOptions: ApolloOptions,
  /** Cross-Origin Resource Sharing configuration. */
  corsOptions: CorsOptions,
  /** Encryption secret for cookies. */
  cookieSecret: string,
  /** Name of the HttpOnly authentication cookie (see {@link operator/auth}). */
  authCookieName: string,
  /** Extra Options for children classes. */
  [extraOption: string]: any
}

/**
 * Extends the ApolloServer configuration.
 */
export type ApolloOptions = ApolloServerExpressConfig & {
  /** Enable/Disable the GraphQL API. */
  enabled: boolean
}

/** {@link ServerFactory} configuration. */
export type ServerOptions = {
  /** HTTP Server configuration. */
  http: {
    /** Enable/Disable the HTTP server. */
    enabled: boolean,
    /** Port to listen to. */
    port: number
  },
  /** HTTPS Server configuration */
  https: {
    /** Enable/Disable the HTTPS server. */
    enabled: boolean,
    /** Port to listen to. */
    port: number,
    /** Path to PEM encoded Server Certificate Private Key. */
    key: string,
    /** Path to PEM encoded Server Certificate Public Key. */
    cert: string,
    /** Path to PEM encoded Server Certificate Authority. */
    ca: string
  }
}

/** Required informations to start listening. */
export type ServerInfo = {
  /** HTTP(S) server that needs to listen. */
  server: http.Server | https.Server,
  /** Port to listen to. */
  port: number
}

/** List of {@link ServerInfo} returned by {@link ServerFactory.make}. */
export type ServerList = ServerInfo[]
