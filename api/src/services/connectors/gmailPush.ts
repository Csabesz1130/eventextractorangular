import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'
import { pollGmailMessages, getEmailBody } from 'src/lib/gmail'
import { callExtractionAPI } from 'src/lib/extractionApi'
import { applyConfidenceRules } from 'src/lib/confidenceRules'

interface GmailPushMessage {
  emailAddress: string
  historyId: string
}

/**
 * Process Gmail push notification
 * Fetches new messages since last historyId and extracts events
 */
export async function processGmailPush(message: GmailPushMessage) {
  try {
    // Find connector for this email address
    const connector = await db.connector.findFirst({
      where: {
        email: message.emailAddress,
        provider: 'GMAIL',
        enabled: true,
      },
      include: {
        user: {
          include: {
            settings: true,
          },
        },
      },
    })

    if (!connector) {
      logger.warn('No connector found for email', {
        email: message.emailAddress,
      })
      return
    }

    // Get messages since last historyId
    // Note: In a real implementation, you'd use Gmail history API
    // For now, we'll fetch recent unread messages
    const messages = await pollGmailMessages(connector)

    if (messages.length === 0) {
      logger.info('No new messages to process', {
        email: message.emailAddress,
      })
      return
    }

    const timezone = connector.user.settings?.timezone || 'UTC'
    const confidenceMin = connector.user.settings?.confidenceMin || 0.7

    // Process each message
    for (const gmailMessage of messages) {
      try {
        const subject =
          gmailMessage.payload?.headers?.find((h: any) => h.name === 'Subject')
            ?.value || ''
        const from =
          gmailMessage.payload?.headers?.find((h: any) => h.name === 'From')
            ?.value || ''
        const body = getEmailBody(gmailMessage)

        if (!body) {
          continue
        }

        // Detect language from headers or content
        const languageHeader =
          gmailMessage.payload?.headers?.find(
            (h: any) => h.name === 'Content-Language'
          )?.value || 'en'
        const locale = languageHeader.split('-')[0] || 'en'

        // Call extraction API
        const extracted = await callExtractionAPI({
          text: `${subject}\n\n${body}`,
          source: 'gmail',
          source_meta: {
            messageId: gmailMessage.id,
            subject,
            from,
            locale,
          },
          locale,
          timezone,
        })

        // Apply confidence rules
        const boostedConfidence = applyConfidenceRules(
          extracted,
          {
            from,
            subject,
            body,
            locale,
          },
          connector.user.settings
        )

        // Only create suggestion if confidence is high enough
        if (boostedConfidence >= confidenceMin) {
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
              confidence: boostedConfidence,
              rawText: body,
              source: 'gmail',
              sourceMeta: {
                messageId: gmailMessage.id,
                subject,
                from,
                locale,
              },
              status: 'PENDING',
            },
          })

          logger.info('Suggestion created from Gmail push', {
            suggestionId: suggestion.id,
            confidence: boostedConfidence,
            email: message.emailAddress,
          })

          // Check if auto-approve should trigger
          if (
            connector.user.settings?.autoApprove &&
            boostedConfidence >= (connector.user.settings.confidenceMin || 0.7)
          ) {
            // Auto-approve will be handled by the scheduled service
            // But we could also do it here synchronously
            logger.info('Suggestion qualifies for auto-approve', {
              suggestionId: suggestion.id,
            })
          }
        } else {
          logger.info('Suggestion confidence too low', {
            confidence: boostedConfidence,
            threshold: confidenceMin,
            email: message.emailAddress,
          })
        }
      } catch (error: any) {
        logger.error('Failed to process Gmail message', {
          error: error.message,
          messageId: gmailMessage.id,
        })
      }
    }

    // Update connector's last polled timestamp
    await db.connector.update({
      where: { id: connector.id },
      data: { lastPolled: new Date() },
    })
  } catch (error: any) {
    logger.error('Error processing Gmail push', {
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

