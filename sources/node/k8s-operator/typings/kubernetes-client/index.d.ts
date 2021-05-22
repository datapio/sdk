declare module 'kubernetes-client' {
  export { KubeConfig } from '@kubernetes/client-node'

  export class Client {
    constructor({ backend: any })

    loadSpec(): Promise<void>
    addCustomResourceDefinition(crd: any): void

    apis: {
      [apiGroup: string]: {
        [resourceVersion: string]: Endpoint
      }
    }

    api: {
      [resourceVersion: string]: Endpoint
    }
  }

  export interface Endpoint {
    watch: Endpoint
    namespaces(ns: string): Endpoint
    [kind: string]: Endpoint
    (name: string): Endpoint

    getObjectStream(): Promise<Stream>
    get(opts?: QueryOptions): Promise<Response>
    post(opts?: QueryOptions): Promise<Response>
    put(opts?: QueryOptions): Promise<Response>
    patch(opts?: QueryOptions): Promise<Response>
    delete(opts?: QueryOptions): Promise<Response>

    exec: {
      post(opts?: QueryOptions): Promise<Response>
    }

    log: {
      get(opts?: QueryOptions): Promise<Response>
    }
  }

  type QueryOptions = {
    qs?: any,
    body?: any,
    headers?: RequestHeaders
  }

  type RequestHeaders = {
    [name: string]: string
  }

  export interface Response {
    statusCode: number,
    body: Resource | Collection
  }

  export type Resource = any
  export type Collection = {
    items: any[]
  }
}

declare module 'kubernetes-client/backends/request' {
  import type { KubeConfig } from '@kubernetes/client-node'

  export default class Request {
    constructor(opts: { kubeconfig: KubeConfig })
  }
}
