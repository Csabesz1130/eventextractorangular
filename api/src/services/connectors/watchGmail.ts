import { google } from 'googleapis'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'
import { getGmailClient } from 'src/lib/gmail'

const GOOGLE_PUBSUB_TOPIC =
  process.env.GOOGLE_PUBSUB_TOPIC || 'projects/your-project/topics/gmail-push'
const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID

/**
 * Register Gmail watch() for push notifications
 * This should be called after OAuth connection
 */
export async function watchGmail(connectorId: string) {
  try {
    const connector = await db.connector.findUnique({
      where: { id: connectorId },
    })

    if (!connector || !connector.accessToken) {
      throw new Error('Connector not found or not authenticated')
    }

    const client = await getGmailClient(connector)
    if (!client) {
      throw new Error('Failed to get Gmail client')
    }

    // Call Gmail watch() API
    const watchResponse = await client.gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: GOOGLE_PUBSUB_TOPIC,
        labelIds: ['INBOX'], // Watch for inbox messages
      },
    })

    logger.info('Gmail watch() registered', {
      connectorId,
      historyId: watchResponse.data.historyId,
    })

    // Store historyId for future reference
    // Note: You might want to add a historyId field to Connector model
    // For now, we'll just log it

    return {
      historyId: watchResponse.data.historyId,
      expiration: watchResponse.data.expiration,
    }
  } catch (error: any) {
    logger.error('Failed to register Gmail watch', {
      error: error.message,
      connectorId,
    })
    throw error
  }
}

/**
 * Stop watching Gmail (unwatch)
 */
export async function unwatchGmail(connectorId: string) {
  try {
    const connector = await db.connector.findUnique({
      where: { id: connectorId },
    })

    if (!connector || !connector.accessToken) {
      throw new Error('Connector not found or not authenticated')
    }

    const client = await getGmailClient(connector)
    if (!client) {
      throw new Error('Failed to get Gmail client')
    }

    await client.gmail.users.stop({
      userId: 'me',
    })

    logger.info('Gmail watch() stopped', { connectorId })
  } catch (error: any) {
    logger.error('Failed to stop Gmail watch', {
      error: error.message,
      connectorId,
    })
    throw error
  }
}

