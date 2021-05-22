/**
 * Provides utility functions to work with collections of items within a
 * GraphQL resolver.
 *
 * @module graphql/utils/collection
 */

export type SortingOptions = {
  /** Key to sort against. */
  key: string,
  /** Sort in ascending or descending order (defaults to `false`). */
  reversed?: boolean
}

export type PaginationOptions = {
  /** Skip first N items (defaults to `0`). */
  offset?: number,
  /** Skip last N items (defaults to `Number.MAX_SAFE_INTEGER`). */
  limit?: number
}

export type CollectionOptions = {
  paging?: PaginationOptions,
  sorting?: SortingOptions
}

/**
 * Sort a collection of items.
 *
 * @param items Collection to sort.
 * @param options Sorting options.
 * @returns Sorted collection.
 */
export const sort = (items: any[], options: SortingOptions) => {
  const { key, reversed = false } = options

  const sorted = items.slice().sort((item, other) => {
    if (item[key] > other[key]) {
      return 1
    }
    else if (item[key] < other[key]) {
      return -1
    }

    return 0
  })

  if (reversed) {
    sorted.reverse()
  }

  return sorted
}

/**
 * Returns a slice from a collection of items.
 *
 * @param items Collection of items.
 * @param options Pagination options.
 * @returns Slice of collection.
 */
export const pagination = (items: any[], options: PaginationOptions) => {
  const { offset = 0, limit = Number.MAX_SAFE_INTEGER} = options
  return items.slice(offset).slice(0, limit)
}

/**
 * Apollo resolver for to sort and paginate a collection of items.
 *
 * @param parent Parent object containing the collection of items.
 * @param options Pagination and Sorting options.
 * @returns Slice of sorted items from a collection.
 */
export const collection = (parent: any, options: CollectionOptions) => {
  const { paging = {}, sorting } = options
  return pagination(
    typeof sorting !== 'undefined'
      ? sort(parent.items, sorting)
      : parent.items,
    paging
  )
}
