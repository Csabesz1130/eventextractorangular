import { google } from 'googleapis'
import { db } from './db'
import { logger } from './logger'

export async function getGmailClient(connector: any) {
  if (!connector.accessToken) {
    logger.warn(`Connector ${connector.id} has no access token`)
    return null
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: connector.accessToken,
    refresh_token: connector.refreshToken,
  })

  // Check if token needs refresh
  if (connector.tokenExpiry && new Date() >= connector.tokenExpiry) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)

      // Update connector with new tokens
      await db.connector.update({
        where: { id: connector.id },
        data: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || connector.refreshToken,
          tokenExpiry: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : null,
        },
      })
    } catch (error) {
      logger.error('Failed to refresh Google token:', error)
      return null
    }
  }

  return {
    gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
    calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
    auth: oauth2Client,
  }
}

export function getEmailBody(message: any): string {
  let body = ''

  if (message.payload?.parts) {
    const textPart = message.payload.parts.find(
      (part: any) => part.mimeType === 'text/plain'
    )
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString()
    }
  } else if (message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString()
  }

  return body
}

export async function pollGmailMessages(connector: any) {
  const client = await getGmailClient(connector)
  if (!client) {
    return []
  }

  try {
    const response = await client.gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread category:primary',
      maxResults: 10,
    })

    const messages = response.data.messages || []
    const fullMessages = []

    for (const msg of messages) {
      try {
        const full = await client.gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        })
        fullMessages.push(full.data)
      } catch (error) {
        logger.error(`Failed to fetch message ${msg.id}:`, error)
      }
    }

    return fullMessages
  } catch (error) {
    logger.error('Failed to poll Gmail messages:', error)
    return []
  }
}

export async function markAsProcessed(messageId: string, connector: any) {
  const client = await getGmailClient(connector)
  if (!client) {
    return
  }

  try {
    await client.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['EVENT_EXTRACTED'], // Custom label
      },
    })
  } catch (error) {
    logger.error(`Failed to mark message ${messageId} as processed:`, error)
  }
}

