/**
 * Errors can originate from the {@link Operator} or the
 * {@link KubeInterface|Kubernetes Interface}.
 *
 * @module errors
 */


/**
 * Errors originating from {@link Operator}.
 */
export class OperatorError extends Error {
  /**
   * @param msg Description of the error.
   */
  constructor(msg: string) {
    super(msg)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Errors originating from {@link KubeInterface}.
 */
export class KubeError extends Error {
  details: null | any

  /**
   * @param msg Description of the error.
   * @param details Extra informations about the error.
   */
  constructor(msg: string, details: null | any = null) {
    super(msg)
    this.name = this.constructor.name
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}
