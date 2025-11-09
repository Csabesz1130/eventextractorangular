import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { logger } from 'src/lib/logger'
import { processGmailPush } from 'src/services/connectors/gmailPush'

/**
 * Webhook endpoint for Google Pub/Sub Gmail push notifications
 * 
 * This endpoint receives push notifications from Google Cloud Pub/Sub
 * when new emails arrive in Gmail accounts that have been watched.
 * 
 * Setup required in Google Cloud Console:
 * 1. Create Pub/Sub topic: gmail-push
 * 2. Create subscription: gmail-push-sub
 * 3. Configure push subscription to point to this endpoint
 * 4. Grant Gmail API service account Pub/Sub Publisher role
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Verify this is a Pub/Sub message
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      }
    }

    const body = JSON.parse(event.body)

    // Pub/Sub sends messages in this format
    if (body.message && body.message.data) {
      const messageData = JSON.parse(
        Buffer.from(body.message.data, 'base64').toString()
      )

      logger.info('Received Gmail push notification', {
        emailAddress: messageData.emailAddress,
        historyId: messageData.historyId,
      })

      // Process the Gmail push notification
      await processGmailPush(messageData)

      // Return 200 to acknowledge receipt
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }
    }

    // Handle subscription verification (Pub/Sub sends this initially)
    if (body.type === 'subscription') {
      logger.info('Pub/Sub subscription verification received')
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid message format' }),
    }
  } catch (error: any) {
    logger.error('Error processing Gmail push notification', {
      error: error.message,
      stack: error.stack,
    })

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}

