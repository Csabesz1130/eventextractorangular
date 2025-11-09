import { db } from './db'
import { logger } from './logger'
import { context } from '@redwoodjs/graphql-server'

export type AuditAction =
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'suggestion.created'
  | 'suggestion.approved'
  | 'suggestion.rejected'
  | 'suggestion.snoozed'
  | 'connector.connected'
  | 'connector.disconnected'
  | 'connector.polled'
  | 'settings.updated'
  | 'user.login'
  | 'user.logout'

interface AuditLogInput {
  action: AuditAction
  entityType?: string
  entityId?: string
  metadata?: Record<string, any>
  userId?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Create audit log entry
 */
export const audit = async (input: AuditLogInput) => {
  try {
    // Get context from GraphQL request if not provided
    const userId =
      input.userId || (context as any)?.currentUser?.id || null
    const ipAddress =
      input.ipAddress ||
      (context as any)?.event?.headers?.['x-forwarded-for'] ||
      (context as any)?.event?.requestContext?.identity?.sourceIp ||
      null
    const userAgent =
      input.userAgent || (context as any)?.event?.headers?.['user-agent'] || null

    await db.auditLog.create({
      data: {
        userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata || {},
        ipAddress,
        userAgent,
      },
    })

    logger.info('Audit log created', {
      action: input.action,
      userId,
      entityId: input.entityId,
    })
  } catch (error: any) {
    // Don't throw - audit logging failures shouldn't break the app
    logger.error('Failed to create audit log', {
      error: error.message,
      input,
    })
  }
}

/**
 * Get audit logs for a user
 */
export const getUserAuditLogs = async (
  userId: string,
  options?: {
    limit?: number
    action?: AuditAction
    startDate?: Date
    endDate?: Date
  }
) => {
  return db.auditLog.findMany({
    where: {
      userId,
      action: options?.action,
      createdAt: {
        gte: options?.startDate,
        lte: options?.endDate,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
  })
}

/**
 * Get audit logs for an entity
 */
export const getEntityAuditLogs = async (
  entityType: string,
  entityId: string,
  limit = 50
) => {
  return db.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

