/**
 * Abstraction of `kubernetes-client` library.
 *
 * @module kube-interface
 */

import Request from 'kubernetes-client/backends/request'
import { KubeConfig, Client } from 'kubernetes-client'

import * as u from './utils'
import * as t from './types'

/**
 * Provide a simplified interface to the Kubernetes API Server.
 */
export class KubeInterface {
  /** KubeConfig for this interface. */
  config: KubeConfig
  /** List of CustomResourceDefinitions. */
  crds: any[]
  /** Underlying Kubernetes Client. */
  client: Client
  #createCRDs: boolean

  constructor(opts: t.KubeInterfaceOptions) {
    const { crds = [], createCRDs = true, config = null } = opts

    if (config !== null) {
      this.config = config
    }
    else {
      this.config = new KubeConfig()
      this.config.loadFromDefault()
    }

    const backend = new Request({ kubeconfig: this.config })
    this.client = new Client({ backend })
    this.crds = crds
    this.#createCRDs = createCRDs
  }

  /**
   * Load the Kubernetes OpenAPI specification and its
   * CustomResourceDefinitions.
   */
  async load() {
    await this.client.loadSpec()

    const extension = this.client.apis['apiextensions.k8s.io'].v1beta1
    const api = extension.customresourcedefinitions

    const remoteCRDs = <t.Resource[]> u.response.unwrap(await api.get(), true)
    const missingCRDs = this.crds.filter(
      crd => remoteCRDs.filter(
        remoteCRD => crd.metadata.name === remoteCRD.metadata!.name
      ).length === 0
    )

    if (this.#createCRDs) {
      await Promise.all(missingCRDs.map(async crd => {
        await api.post({ body: crd })
      }))
    }

    this.crds = [
      ...remoteCRDs,
      ...missingCRDs
    ]

    this.crds.map(this.client.addCustomResourceDefinition.bind(this.client))
  }

  /**
   * Create Kubernetes resources.
   *
   * @param resources Resources to create.
   * @returns Created resources.
   */
  async create(...resources: t.Resource[]): Promise<t.Resource[]> {
    return await Promise.all(resources
      .map(resource => ({
        kind: resource.kind,
        namespace: resource.metadata?.namespace,
        body: resource,
        ...u.parseApiVersion(resource.apiVersion)
      }))
      .map(({ apiGroup, resourceVersion, kind, namespace, body }) => ({
        endpoint: u.getEndpoint(this.client, {
          apiGroup,
          resourceVersion,
          kind,
          namespace
        }),
        body
      }))
      .map(async ({ endpoint, body }) => await endpoint.post({ body }))
      .map(async resp => <t.Resource> u.response.unwrap(await resp))
    )
  }

  /**
   * List Kubernetes Resources.
   *
   * @returns Collection of Kubernetes Resources
   */
  async list({ apiVersion, kind, namespace, labels }: t.List): Promise<t.Resource[]> {
    const { apiGroup, resourceVersion } = u.parseApiVersion(apiVersion)
    const endpoint = u.getEndpoint(this.client, {
      apiGroup,
      resourceVersion,
      kind,
      namespace
    })

    return <t.Resource[]> u.response.unwrap(
      await endpoint.get({ qs: `l=${encodeURIComponent(labels || '')}` }),
      true
    )
  }

  /**
   * Get a single Kubernetes Resource.
   *
   * @returns Kubernetes Resource.
   */
  async get({ apiVersion, kind, namespace, name }: t.Get): Promise<t.Resource> {
    const { apiGroup, resourceVersion } = u.parseApiVersion(apiVersion)
    const endpoint = u.getEndpoint(this.client, {
      apiGroup,
      resourceVersion,
      kind,
      namespace,
      name
    })

    return <t.Resource> u.response.unwrap(await endpoint.get())
  }

  /**
   * Watch `ADDED`, `MODIFIED` and `DELETED` events on Kubernetes Resources
   *
   * @returns A stream of events.
   */
  async watch({ apiVersion, kind, namespace, name }: t.Watch) {
    const { apiGroup, resourceVersion } = u.parseApiVersion(apiVersion)
    const endpoint = u.getEndpoint(this.client, {
      apiGroup,
      resourceVersion,
      kind,
      namespace,
      name
    }, true)

    return await endpoint.getObjectStream()
  }

  /**
   * Wait for a Kubernetes Resource to match a condition.
   * @returns Condition callback's result.
   */
  async waitCondition({
    apiVersion,
    kind,
    namespace,
    name,
    callback = u.defaultCallback
  }: t.WaitCondition) {
    const resourceStream = await this.watch({
      apiVersion,
      kind,
      namespace,
      name
    })

    const result = await new Promise((resolve, reject) => {
      resourceStream.on('data', async ({ object }: { object: any }) => {
        try {
          const { condition, res } = await callback(object)
          if (condition) {
            resolve(res)
          }
        }
        catch (err) {
          reject(err)
        }
      })
    })

    resourceStream.destroy()
    return result
  }

  /**
   * Patch a Kubernetes Resource.
   * @returns Patched Kubernetes Resource.
   */
  async patch({ apiVersion, kind, namespace, name, patch, patchType = 'merge' }: t.Patch): Promise<t.Resource> {
    const { apiGroup, resourceVersion } = u.parseApiVersion(apiVersion)
    const endpoint = u.getEndpoint(this.client, {
      apiGroup,
      resourceVersion,
      kind,
      namespace,
      name
    })

    const contentType = {
      json: 'application/json-patch+json',
      merge: 'application/merge-patch+json',
      strategic: 'application/strategic-merge-patch+json'
    }

    return <t.Resource> u.response.unwrap(await endpoint.patch({
      body: patch,
      headers: {
        'content-type': contentType[patchType]
      }
    }))
  }

  /**
   * Replace a Kubernetes Resource.
   * @returns Replaced Kubernetes Resource.
   */
  async replace(resource: t.Resource): Promise<t.Resource> {
    const { apiGroup, resourceVersion } = u.parseApiVersion(resource.apiVersion)
    const endpoint = u.getEndpoint(this.client, {
      apiGroup,
      resourceVersion,
      kind: resource.kind,
      namespace: resource.metadata!.namespace,
      name: resource.metadata!.name
    })

    return <t.Resource> u.response.unwrap(await endpoint.put({ body: resource }))
  }

  /**
   * Delete a Kubernetes Resource.
   * @returns Deleted Kubernetes Resource.
   */
  async delete({ apiVersion, kind, namespace, name }: t.Delete): Promise<t.Resource> {
    const { apiGroup, resourceVersion } = u.parseApiVersion(apiVersion)
    const endpoint = u.getEndpoint(this.client, {
      apiGroup,
      resourceVersion,
      kind,
      namespace,
      name
    })

    return <t.Resource> u.response.unwrap(await endpoint.delete())
  }

  /**
   * Execute a command inside a Kubernetes Pod container.
   * @returns Executed command's logs.
   */
  async exec({ namespace, name, command, container }: t.Exec): Promise<string> {
    const { apiGroup, resourceVersion } = u.parseApiVersion('v1')
    const endpoint = u.getEndpoint(this.client, {
      apiGroup,
      resourceVersion,
      kind: 'Pod',
      namespace,
      name
    })
    return <string> <unknown> u.response.unwrap(await endpoint.exec.post({
      qs: {
        command,
        container,
        stdout: true,
        stderr: true
      }
    }))
  }

  /**
   * Fetch logs from a Kubernetes Pod container.
   * @returns Logs.
   */
  async logs({ namespace, name, container }: t.Logs): Promise<string> {
    const { apiGroup, resourceVersion } = u.parseApiVersion('v1')
    const endpoint = u.getEndpoint(this.client, {
      apiGroup,
      resourceVersion,
      kind: 'Pod',
      namespace,
      name
    })
    return <string> <unknown> u.response.unwrap(await endpoint.log.get({
      qs: {
        container
      }
    }))
  }

  /**
   * Check if the current authenticated user can perform an action on
   * Kubernetes Resources.
   *
   * @returns `true` if the action is allowed, `false` otherwise.
   */
  async canI(meta: t.ReviewAction): Promise<boolean> {
    const reviewer = u.makeReviewer(this, 'SelfSubjectAccessReview')
    const review = await reviewer(meta)
    return review.allowed
  }

  /**
   * Check if an authenticated user can perform an action on Kubernetes
   * Resources.
   *
   * @returns `true` if the action is allowed, `false` otherwise.
   */
  async canThey(meta: t.ReviewAction): Promise<boolean> {
    const reviewKind = meta.namespace ? 'LocalSubjectAccessReview' : 'SubjectAccessReview'
    const reviewer = u.makeReviewer(this, reviewKind)
    const review = await reviewer(meta)
    return review.allowed
  }

  /**
   * Fetch authorized actions for the current authenticated user.
   * @returns Authorized actions.
   */
  async myAccessRules({ scopes = [] }) {
    const [resp] = await this.create({
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectRulesReview',
      spec: { scopes }
    })

    return resp.status
  }
}
