import { AuthenticationError, ForbiddenError } from '@redwoodjs/graphql-server'
import { context } from '@redwoodjs/graphql-server'
import { db } from './db'

export interface CurrentUser {
  id: string
  email: string
  name?: string
}

/**
 * Get current user with settings
 */
export const getCurrentUser = async (ctx?: any) => {
  const graphqlContext = ctx || context
  if (!graphqlContext?.currentUser?.id) {
    return null
  }

  return db.user.findUnique({
    where: { id: graphqlContext.currentUser.id },
    include: {
      settings: true,
    },
  })
}

/**
 * Use requireAuth in your services to check that a user is logged in,
 * whether or not they are assigned a role, and optionally raise an
 * error if they're not.
 *
 * @param {string=} roles - An optional role or list of roles
 * @param {string[]=} roles - An optional list of roles

 * @example
 *
 * ```js
 * export const myService = ({ input }, { context }) => {
 *   requireAuth(context)
 *   // your service logic
 * }
 * ```
 */
export const requireAuth = (ctx?: any) => {
  const graphqlContext = ctx || context
  if (!graphqlContext?.currentUser) {
    throw new AuthenticationError(
      'You must be logged in to access this resource'
    )
  }
}

/**
 * Require specific user
 */
export const requireUser = (ctx: any, userId: string) => {
  requireAuth(ctx)

  const graphqlContext = ctx || context
  if (graphqlContext.currentUser.id !== userId) {
    throw new ForbiddenError(
      'You do not have permission to access this resource'
    )
  }
}

/**
 * Check if user owns resource
 */
export const requireOwnership = async (
  ctx: any,
  model: 'event' | 'eventSuggestion' | 'connector',
  id: string
) => {
  requireAuth(ctx)

  const graphqlContext = ctx || context
  const resource = await (db[model] as any).findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!resource) {
    throw new Error(`${model} not found`)
  }

  if (resource.userId !== graphqlContext.currentUser.id) {
    throw new ForbiddenError(
      'You do not have permission to access this resource'
    )
  }

  return resource
}

