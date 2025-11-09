import { db } from 'src/lib/db'
import { requireAuth, getCurrentUser } from 'src/lib/auth'
import { callExtractionAPI } from 'src/lib/extractionApi'
import { syncToConnectedCalendars } from 'src/lib/calendarSync'
import { logger, timed } from 'src/lib/logger'
import { audit } from 'src/lib/auditLogger'
import { NotFoundError } from 'src/lib/errorHandler'
import { rateLimiters, getRateLimitKey } from 'src/lib/rateLimit'
import { applyConfidenceRules, getSmartDefaults } from 'src/lib/confidenceRules'

export const suggestions = async ({
  status,
  limit = 50,
}: {
  status?: string
  limit?: number
}) => {
  requireAuth()
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const where: any = {
    userId: currentUser.id,
  }

  if (status) {
    where.status = status
  }

  return db.eventSuggestion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export const suggestion = async (
  { id }: { id: string },
  { context }: { context: any }
) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const suggestion = await db.eventSuggestion.findUnique({
    where: {
      id,
      userId: currentUser.id,
    },
  })

  if (!suggestion) {
    throw new NotFoundError('EventSuggestion', id)
  }

  return suggestion
}

export const extractEvent = async (
  { input }: { input: any },
  { context }: { context: any }
) => {
  requireAuth(context)

  // Rate limiting for extraction (expensive operation)
  await rateLimiters.extraction(getRateLimitKey(context))

  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  // Get user settings for timezone
  const settings = await db.userSettings.findUnique({
    where: { userId: currentUser.id },
  })

  const timezone = settings?.timezone || 'UTC'

  // Call FastAPI extraction service
  const extracted = await callExtractionAPI({
    text: input.text,
    source: input.source,
    source_meta: input.sourceMeta,
    locale: input.sourceMeta?.locale || 'en',
    timezone,
  })

  // Apply confidence rules
  const context = {
    from: input.sourceMeta?.from || '',
    subject: input.sourceMeta?.subject || '',
    body: input.text,
    locale: input.sourceMeta?.locale || 'en',
  }

  const boostedConfidence = applyConfidenceRules(
    extracted,
    context,
    settings
  )

  // Get smart defaults
  const smartDefaults = getSmartDefaults(extracted, context)

  // Apply smart defaults
  let finalTitle = extracted.title || smartDefaults.title || 'Untitled'
  let finalLocation = extracted.location || smartDefaults.location || null
  let finalEnd = extracted.end

  // If no end time, add default duration
  if (extracted.start && !finalEnd && smartDefaults.duration) {
    const startDate = new Date(extracted.start)
    finalEnd = new Date(
      startDate.getTime() + smartDefaults.duration * 60 * 1000
    ).toISOString()
  }

  // Fix past dates (add 1 year if event is in the past)
  let finalStart = extracted.start ? new Date(extracted.start) : null
  if (finalStart && finalStart < new Date()) {
    finalStart = new Date(
      finalStart.getFullYear() + 1,
      finalStart.getMonth(),
      finalStart.getDate(),
      finalStart.getHours(),
      finalStart.getMinutes()
    )
    logger.info('Adjusted past date to next year', {
      original: extracted.start,
      adjusted: finalStart.toISOString(),
    })
  }

  // Store as suggestion
  const suggestion = await db.eventSuggestion.create({
    data: {
      userId: currentUser.id,
      title: finalTitle,
      description: extracted.description || null,
      start: finalStart,
      end: finalEnd ? new Date(finalEnd) : null,
      timezone: extracted.timezone,
      location: finalLocation,
      attendees: extracted.attendees || [],
      reminders: extracted.reminders || [30],
      confidence: boostedConfidence,
      rawText: input.text,
      source: input.source,
      sourceMeta: input.sourceMeta || null,
      status: 'PENDING',
    },
  })

  // Audit log
  await audit({
    action: 'suggestion.created',
    entityType: 'EventSuggestion',
    entityId: suggestion.id,
    metadata: { title: suggestion.title, source: suggestion.source },
  })

  return suggestion
}

export const approveSuggestion = async (
  { id }: { id: string },
  { context }: { context: any }
) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const suggestion = await db.eventSuggestion.findUnique({
    where: {
      id,
      userId: currentUser.id,
    },
  })

  if (!suggestion) {
    throw new NotFoundError('EventSuggestion', id)
  }

  if (suggestion.status !== 'PENDING') {
    throw new Error('Suggestion is not pending')
  }

  // Create event from suggestion
  const event = await db.event.create({
    data: {
      userId: currentUser.id,
      title: suggestion.title,
      description: suggestion.description,
      start: suggestion.start || new Date(),
      end: suggestion.end,
      timezone: suggestion.timezone,
      location: suggestion.location,
      attendees: suggestion.attendees,
      reminders: suggestion.reminders,
      source: suggestion.source,
      rawText: suggestion.rawText,
      confidence: suggestion.confidence,
    },
  })

  // Update suggestion status
  await db.eventSuggestion.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      eventId: event.id,
    },
  })

  // Sync to connected calendars
  await syncToConnectedCalendars(event)

  // Audit log
  await audit({
    action: 'suggestion.approved',
    entityType: 'EventSuggestion',
    entityId: id,
    metadata: { eventId: event.id, title: event.title },
  })

  return event
}

export const rejectSuggestion = async (
  { id }: { id: string },
  { context }: { context: any }
) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const suggestion = await db.eventSuggestion.update({
    where: {
      id,
      userId: currentUser.id,
    },
    data: {
      status: 'REJECTED',
    },
  })

  // Audit log
  await audit({
    action: 'suggestion.rejected',
    entityType: 'EventSuggestion',
    entityId: id,
  })

  return suggestion
}

export const snoozeSuggestion = async (
  {
    id,
    until,
  }: {
    id: string
    until: Date
  },
  { context }: { context: any }
) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const suggestion = await db.eventSuggestion.update({
    where: {
      id,
      userId: currentUser.id,
    },
    data: {
      status: 'SNOOZED',
      snoozedUntil: until,
    },
  })

  // Audit log
  await audit({
    action: 'suggestion.snoozed',
    entityType: 'EventSuggestion',
    entityId: id,
    metadata: { snoozedUntil: until.toISOString() },
  })

  return suggestion
}

