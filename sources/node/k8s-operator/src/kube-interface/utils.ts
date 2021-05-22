/**
 * Utility functions for {@link KubeInterface}.
 *
 * @module kube-interface/utils
 */

import { KubeError } from '../errors'
import { Client } from 'kubernetes-client'
import type { Endpoint, Response } from 'kubernetes-client'
import { WaitCallback, Resource, ReviewAction } from './types'
import { KubeInterface } from './index'

/**
 * Metadata required to identify the Kubernetes API Endpoint.
 */
export type EndpointMetadata = {
  /** Kubernetes API Group (example: `batch`). */
  apiGroup?: string,
  /** Kubernetes API Resource Version (example: `v1`). */
  resourceVersion: string,
  /** Kubernetes Resource kind. */
  kind: string,
  /** Kubernetes Resource namespace. */
  namespace?: string,
  /** Kubernetes Resource name. */
  name?: string
}

export const defaultCallback: WaitCallback =
  async () => ({ condition: true, res: null })

const apiVersionRegex = /^(?:(?<apiGroup>[a-zA-Z][a-zA-Z0-9\-_.]*)\/)?(?<resourceVersion>.*)$/u
type ParsedApiVersion = { apiGroup?: string, resourceVersion: string }

/**
 * Parse Kubernetes API Version into API Group and API Resource Version.
 *
 * @param apiVersion Kubernetes API Version (example: `batch/v1`).
 * @returns API Group and Resource Version (example: `{apiGroup: 'batch', resourceVersion: 'v1}`).
 */
export const parseApiVersion = (apiVersion: string): ParsedApiVersion => {
  const match = apiVersionRegex.exec(apiVersion)

  if (match) {
    return <ParsedApiVersion> match.groups
  }

  throw new KubeError('Invalid API Version', { apiVersion })
}

/**
 * Get Kubernetes API endpoint from resource metadata.
 *
 * @param client Kubernetes Client.
 * @param meta Kubernetes resource metadata.
 * @param watch `true` if it's a `WATCH` endpoint, `false` otherwise (the default).
 * @returns Kubernetes API endpoint.
 */
export const getEndpoint = (client: Client, meta: EndpointMetadata, watch = false): Endpoint => {
  const {
    apiGroup,
    resourceVersion,
    kind,
    namespace,
    name
  } = meta

  const fns = [
    (ep: Endpoint): Endpoint => {
      return watch ? ep.watch : ep
    },
    (ep: Endpoint): Endpoint => {
      return namespace ? ep.namespaces(namespace) : ep
    },
    (ep: Endpoint): Endpoint => {
      return ep[kind.toLowerCase()]
    },
    (ep: Endpoint): Endpoint => {
      return name ? ep(name) : ep
    }
  ]

  try {
    return fns.reduce(
      (ep, fn) => fn(ep),
      apiGroup
        ? client.apis[apiGroup][resourceVersion]
        : client.api[resourceVersion]
    )
  }
  catch (err) {
    throw new KubeError(
      'Unknown API',
      {
        meta,
        err
      }
    )
  }
}

/** Kubernetes Response Parser. */
export const response = {
  /**
   * Throw a {@link KubeError} if the response is not successful.
   *
   * @param resp Response to validate.
   */
  assertStatusCode: (resp: Response) => {
    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      throw new KubeError(
        'Unexpected response from Kubernetes API Server',
        {
          resp
        }
      )
    }
  },
  /**
   * Fetch response's body.
   *
   * @param resp Response to parse.
   * @param many `true` if the body contains a collection of items, `false` otherwise (the default).
   * @returns Response's body.
   */
  unwrap: (resp: Response, many = false) => {
    response.assertStatusCode(resp)
    return many ? (<Resource[]> resp.body.items) : (<Resource> resp.body)
  }
}

/**
 * Generate the method to perform a Kubernetes Access Review.
 *
 * @param kubectl
 * @param reviewKind Kubernetes Resource Kind for the review (example: `SelfSubjectAccessReview`)
 * @returns Status of the Kubernetes Access Review response
 */
export const makeReviewer = (kubectl: KubeInterface, reviewKind: string) =>
  async ({ apiVersion, kind, namespace, verb }: ReviewAction) => {
    const { apiGroup } = parseApiVersion(apiVersion)
    const [resp] = await kubectl.create({
      apiVersion: 'authorization.k8s.io/v1',
      kind: reviewKind,
      spec: {
        resourceAttributes: {
          group: apiGroup,
          resource: kind.toLowerCase(),
          verb,
          namespace
        }
      }
    })

    return resp.status
  }
