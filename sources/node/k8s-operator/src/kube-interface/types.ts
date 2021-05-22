/**
 * Type definitions for the {@link kube-interface} module.
 *
 * @module kube-interface/types
 */

import { KubeConfig } from 'kubernetes-client'

/** {@link KubeInterface} configuration. */
export type KubeInterfaceOptions = {
  /** List of CustomResourceDefinition to load. */
  crds?: any[],
  /** If `true`, will create the CRDs if they do not exist on the Kubernetes API Server. */
  createCRDs?: boolean,
  /** KubeConfig to load (set to `null` to use the default one). */
  config?: KubeConfig | null
}

/** Parameters for {@link KubeInterface.list}. */
export type List = {
  /** Kubernetes Resource API Version (example: `batch/v1`). */
  apiVersion: string,
  /** Kubernetes Resource kind (example: `Job`). */
  kind: string,
  /** Kubernetes Resource namespace. */
  namespace?: string,
  /** Kubernetes Resource label filter. */
  labels?: string
}

/** Parameters for {@link KubeInterface.get}. */
export type Get = {
  /** Kubernetes Resource API Version (example: `batch/v1`). */
  apiVersion: string,
  /** Kubernetes Resource kind (example: `Job`). */
  kind: string,
  /** Kubernetes Resource namespace. */
  namespace?: string,
  /** Kubernetes Resource name. */
  name: string
}

/** Parameters for {@link KubeInterface.watch}. */
export type Watch = {
  /** Kubernetes Resource API Version (example: `batch/v1`). */
  apiVersion: string,
  /** Kubernetes Resource kind (example: `Job`). */
  kind: string,
  /** Kubernetes Resource namespace. */
  namespace?: string,
  /** Kubernetes Resource name. */
  name?: string
}

/** Parameters for {@link KubeInterface.waitCondition}. */
export type WaitCondition = {
  /** Kubernetes Resource API Version (example: `batch/v1`). */
  apiVersion: string,
  /** Kubernetes Resource kind (example: `Job`). */
  kind: string,
  /** Kubernetes Resource namespace. */
  namespace?: string,
  /** Kubernetes Resource name. */
  name?: string,
  /** Condition callback. */
  callback?: WaitCallback
}

/** Condition callback */
export type WaitCallback =
  /**
   * @param resource Kubernetes Resource to check.
   * @returns `{condition: false, res: null}` if the condition is not met, `{condition: true, res: some_value}` otherwise.
   */
  (resource: Resource) => Promise<{
    condition: boolean,
    res: any | null
  }>

/** Parameters for {@link KubeInterface.patch}. */
export type Patch = {
  /** Kubernetes Resource API Version (example: `batch/v1`). */
  apiVersion: string,
  /** Kubernetes Resource kind (example: `Job`). */
  kind: string,
  /** Kubernetes Resource namespace. */
  namespace?: string,
  /** Kubernetes Resource name. */
  name: string,
  /** Patch object. */
  patch: Partial<Resource>,
  /** Type of `PATCH` operation. */
  patchType?: 'json' | 'merge' | 'strategic'
}

/** Parameters for {@link KubeInterface.delete}. */
export type Delete = {
  /** Kubernetes Resource API Version (example: `batch/v1`). */
  apiVersion: string,
  /** Kubernetes Resource kind (example: `Job`). */
  kind: string,
  /** Kubernetes Resource namespace. */
  namespace?: string,
  /** Kubernetes Resource name. */
  name: string
}

/** Parameters for {@link KubeInterface.exec}. */
export type Exec = {
  /** Kubernetes Pod namespace. */
  namespace: string,
  /** Kubernetes Resource name. */
  name: string,
  /** Command to execute. */
  command: string[],
  /** Kubernetes Pod container name. */
  container: string
}

/** Parameters for {@link KubeInterface.logs}. */
export type Logs = {
  /** Kubernetes Pod namespace. */
  namespace: string,
  /** Kubernetes Resource name. */
  name: string,
  /** Kubernetes Pod container name. */
  container: string
}

/** Parameters for {@link KubeInterface.canI} and {@link KubeInterface.canThey}. */
export type ReviewAction = {
  /** Kubernetes Resource API Version (example: `batch/v1`). */
  apiVersion: string,
  /** Kubernetes Resource kind (example: `Job`). */
  kind: string,
  /** Kubernetes Resource namespace. */
  namespace?: string,
  /** Kubernetes verb (example: `create` or `list` or `watch`). */
  verb: string
}

/** Kubernetes Resource. */
export type Resource = {
  /** Kubernetes Resource API Version (example: `batch/v1`). */
  apiVersion: string,
  /** Kubernetes Resource kind (example: `Job`). */
  kind: string,
  /** Kubernetes Resource metadata. */
  metadata?: {
    /** Kubernetes Resource name. */
    name: string,
    /** Kubernetes Resource namespace. */
    namespace?: string,
    /** Kubernetes Resource labels. */
    labels?: {
      [name: string]: string
    },
    /** Kubernetes Resource annotations. */
    annotations?: {
      [name: string]: string
    }
  },
  [propName: string]: any
}
