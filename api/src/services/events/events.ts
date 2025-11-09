import { db } from 'src/lib/db'
import { requireAuth, getCurrentUser, requireOwnership } from 'src/lib/auth'
import { syncToConnectedCalendars } from 'src/lib/calendarSync'
import { logger, timed } from 'src/lib/logger'
import { audit } from 'src/lib/auditLogger'
import { NotFoundError } from 'src/lib/errorHandler'
import { rateLimiters, getRateLimitKey } from 'src/lib/rateLimit'

export const events = async (
  {
    start,
    end,
    limit = 100,
  }: {
    start?: Date
    end?: Date
    limit?: number
  },
  { context }: { context: any }
) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const where: any = {
    userId: currentUser.id,
  }

  if (start || end) {
    where.start = {}
    if (start) {
      where.start.gte = start
    }
    if (end) {
      where.start.lte = end
    }
  }

  return db.event.findMany({
    where,
    orderBy: { start: 'asc' },
    take: limit,
  })
}

export const event = async (
  { id }: { id: string },
  { context }: { context: any }
) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const event = await db.event.findUnique({
    where: {
      id,
      userId: currentUser.id,
    },
  })

  if (!event) {
    throw new NotFoundError('Event', id)
  }

  return event
}

export const createEvent = async (
  { input }: { input: any },
  { context }: { context: any }
) => {
  requireAuth(context)

  // Rate limiting
  await rateLimiters.api(getRateLimitKey(context))

  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  // Create event with timing
  const event = await timed('createEvent', async () => {
    return db.event.create({
      data: {
        ...input,
        userId: currentUser.id,
        attendees: input.attendees || [],
        reminders: input.reminders || [30],
      },
    })
  })

  // Sync to connected calendars
  await syncToConnectedCalendars(event)

  // Audit log
  await audit({
    action: 'event.created',
    entityType: 'Event',
    entityId: event.id,
    metadata: { title: event.title },
  })

  logger.info('Event created', {
    eventId: event.id,
    userId: currentUser.id,
  })

  return event
}

export const updateEvent = async (
  {
    id,
    input,
  }: {
    id: string
    input: any
  },
  { context }: { context: any }
) => {
  // Check ownership
  await requireOwnership(context, 'event', id)

  // Rate limiting
  await rateLimiters.api(getRateLimitKey(context))

  const event = await db.event.update({
    where: {
      id,
    },
    data: input,
  })

  // Re-sync to calendars if event changed
  await syncToConnectedCalendars(event)

  // Audit log
  await audit({
    action: 'event.updated',
    entityType: 'Event',
    entityId: event.id,
    metadata: { title: event.title },
  })

  return event
}

export const deleteEvent = async (
  { id }: { id: string },
  { context }: { context: any }
) => {
  // Check ownership
  await requireOwnership(context, 'event', id)

  // Rate limiting
  await rateLimiters.api(getRateLimitKey(context))

  await db.event.delete({
    where: {
      id,
    },
  })

  // Audit log
  await audit({
    action: 'event.deleted',
    entityType: 'Event',
    entityId: id,
  })

  return true
}

