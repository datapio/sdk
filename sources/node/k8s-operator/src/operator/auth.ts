/**
 * Handle authentication with Kubernetes JSON Web Token.
 *
 * @module operator/auth
 */

import { OperatorError } from '../errors'

import express from 'express'

/**
 * Returns a function to parse the JSON Web Token from:
 *
 *  - `Authorization` header if supplied
 *  - An HttpOnly Cookie
 *
 * If the token cannot be parsed, an {@link OperatorError} will be thrown.
 * Otherwise, the HttpOnly Cookie will be set and the token will be returned.
 *
 * @param name Name of the HttpOnly Cookie.
 * @returns Token parser function.
 */
export const makeTokenProcessor = (name: string) =>
  (req: express.Request, res: express.Response): string => {
    const signedCookie = (): string | undefined => req.signedCookies[name]
    const authHeader = (): string | undefined => {
      const authorization = req.get('authorization')
      if (authorization && !authorization.startsWith('Bearer ')) {
        throw new OperatorError(
          'Invalid Authorization header. \'Bearer\' expected'
        )
      }
      return authorization?.substring(7)
    }

    const token = authHeader() || signedCookie() || null
    if (!token) {
      throw new OperatorError('Missing token')
    }

    res.setHeader(
      'Set-Cookie', `${name}=${token}; HttpOnly`
    )

    return token
  }
