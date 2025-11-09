import { google } from 'googleapis'
import { db } from 'src/lib/db'
import { requireAuth, getCurrentUser } from 'src/lib/auth'
import { logger } from 'src/lib/logger'
import { pollGmailMessages, getEmailBody, markAsProcessed } from 'src/lib/gmail'
import { callExtractionAPI } from 'src/lib/extractionApi'
import { audit } from 'src/lib/auditLogger'
import { rateLimiters, getRateLimitKey } from 'src/lib/rateLimit'
import { watchGmail } from './watchGmail'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export const connectors = async (_: any, { context }: { context: any }) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  return db.connector.findMany({
    where: {
      userId: currentUser.id,
    },
  })
}

export const getGoogleAuthUrl = async (
  _: any,
  { context }: { context: any }
): Promise<string> => {
  requireAuth(context)

  // Rate limiting for auth
  await rateLimiters.auth(getRateLimitKey(context))

  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    state: currentUser.id, // Pass user ID to callback
  })
}

export const connectGmail = async (
  { code }: { code: string },
  { context }: { context: any }
) => {
  requireAuth(context)

  // Rate limiting for auth
  await rateLimiters.auth(getRateLimitKey(context))

  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)

    oauth2Client.setCredentials(tokens)

    // Get user's email
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const profile = await gmail.users.getProfile({ userId: 'me' })

    const email = profile.data.emailAddress
    if (!email) {
      throw new Error('Could not get email from Google profile')
    }

    // Store connector
    const connector = await db.connector.upsert({
      where: {
        userId_provider_email: {
          userId: currentUser.id,
          provider: 'GMAIL',
          email,
        },
      },
      create: {
        userId: currentUser.id,
        provider: 'GMAIL',
        email,
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        enabled: true,
      },
      update: {
        accessToken: tokens.access_token || undefined,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        enabled: true,
      },
    })

    // Register Gmail watch() for push notifications
    try {
      await watchGmail(connector.id)
      logger.info('Gmail watch() registered successfully', {
        connectorId: connector.id,
      })
    } catch (watchError: any) {
      // Don't fail the connection if watch fails
      logger.warn('Failed to register Gmail watch, will use polling', {
        error: watchError.message,
        connectorId: connector.id,
      })
    }

    // Audit log
    await audit({
      action: 'connector.connected',
      entityType: 'Connector',
      entityId: connector.id,
      metadata: { provider: 'GMAIL', email },
    })

    return connector
  } catch (error) {
    logger.error('Failed to connect Gmail:', error)
    throw new Error('Failed to connect Gmail account')
  }
}

export const disconnectConnector = async (
  { id }: { id: string },
  { context }: { context: any }
) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  await db.connector.delete({
    where: {
      id,
      userId: currentUser.id,
    },
  })

  // Audit log
  await audit({
    action: 'connector.disconnected',
    entityType: 'Connector',
    entityId: id,
  })

  return true
}

export const pollConnector = async (
  { id }: { id: string },
  { context }: { context: any }
) => {
  requireAuth(context)

  // Rate limiting for Gmail polling
  await rateLimiters.gmailPoll(getRateLimitKey(context))

  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const connector = await db.connector.findUnique({
    where: {
      id,
      userId: currentUser.id,
    },
    include: {
      user: {
        include: {
          settings: true,
        },
      },
    },
  })

  if (!connector || !connector.enabled) {
    throw new Error('Connector not found or disabled')
  }

  if (connector.provider !== 'GMAIL') {
    throw new Error('Only Gmail polling is currently supported')
  }

  const messages = await pollGmailMessages(connector)
  const suggestions = []

  const timezone = connector.user.settings?.timezone || 'UTC'
  const confidenceMin = connector.user.settings?.confidenceMin || 0.7

  for (const message of messages) {
    try {
      const subject =
        message.payload?.headers?.find((h: any) => h.name === 'Subject')
          ?.value || ''
      const body = getEmailBody(message)

      if (!body) {
        continue
      }

      // Call extraction API
      const extracted = await callExtractionAPI({
        text: `${subject}\n\n${body}`,
        source: 'gmail',
        source_meta: {
          messageId: message.id,
          subject,
        },
        timezone,
      })

      // Only create suggestion if confidence is high enough
      if (extracted.confidence >= confidenceMin) {
        const suggestion = await db.eventSuggestion.create({
          data: {
            userId: connector.userId,
            title: extracted.title || 'Untitled',
            description: extracted.description || null,
            start: extracted.start ? new Date(extracted.start) : null,
            end: extracted.end ? new Date(extracted.end) : null,
            timezone: extracted.timezone,
            location: extracted.location || null,
            attendees: extracted.attendees || [],
            reminders: extracted.reminders || [30],
            confidence: extracted.confidence,
            rawText: body,
            source: 'gmail',
            sourceMeta: {
              messageId: message.id,
              subject,
            },
            status: 'PENDING',
          },
        })

        suggestions.push(suggestion)

        // Mark message as processed
        if (message.id) {
          await markAsProcessed(message.id, connector)
        }
      }
    } catch (error) {
      logger.error(`Failed to process message ${message.id}:`, error)
    }
  }

  // Update last polled timestamp
  await db.connector.update({
    where: { id: connector.id },
    data: { lastPolled: new Date() },
  })

  // Audit log
  await audit({
    action: 'connector.polled',
    entityType: 'Connector',
    entityId: connector.id,
    metadata: { suggestionsCount: suggestions.length },
  })

  return suggestions
}

