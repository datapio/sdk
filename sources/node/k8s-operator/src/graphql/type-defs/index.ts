/**
 * Provides frequently used GraphQL Type definitions.
 *
 * @module graphql/type-defs
 */

import { gql } from 'apollo-server-express'
import path from 'path'
import fs from 'fs'

const requireTypeDef = (name: string) =>
  gql(fs.readFileSync(
    path.resolve(__dirname, `./${name}.graphql`),
    { encoding: 'utf8' }
  ))

/** GraphQL Type definition for a Kubernetes Label. */
export const Label = requireTypeDef('label')
/** GraphQL Type definition for a Kubernetes Annotation. */
export const Annotation = requireTypeDef('annotation')
/** GraphQL Type definition for a Kubernetes Namespaced Resource. */
export const NamespacedResource = requireTypeDef('namespaced-resource')
/** GraphQL Type definition for a Kubernetes Clustered Resource. */
export const ClusterResource = requireTypeDef('cluster-resource')
/** GraphQL Type definition for a Kubernetes Resource filter. */
export const ResourceField = requireTypeDef('resource-field')
/** GraphQL Type definition for a collection of items. */
export const Collection = requireTypeDef('collection')
