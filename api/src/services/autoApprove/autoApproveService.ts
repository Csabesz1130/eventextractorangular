import { db } from 'src/lib/db'
import { logger, timed } from 'src/lib/logger'
import { approveSuggestion } from 'src/services/suggestions/suggestions'
import { sendSuggestionNotification } from 'src/lib/emailSender'
import { audit } from 'src/lib/auditLogger'

/**
 * Auto-approve service
 * Runs periodically to check and approve high-confidence suggestions
 * 
 * This should be called by a cron job or scheduled task every minute
 */
export async function processAutoApprove() {
  return timed('processAutoApprove', async () => {
    try {
      // Find all users with auto-approve enabled
      const usersWithAutoApprove = await db.user.findMany({
        where: {
          settings: {
            autoApprove: true,
          },
        },
        include: {
          settings: true,
        },
      })

      logger.info('Processing auto-approve', {
        userCount: usersWithAutoApprove.length,
      })

      let totalApproved = 0

      for (const user of usersWithAutoApprove) {
        const confidenceMin = user.settings?.confidenceMin || 0.7

        // Find pending suggestions that meet the confidence threshold
        const suggestions = await db.eventSuggestion.findMany({
          where: {
            userId: user.id,
            status: 'PENDING',
            confidence: {
              gte: confidenceMin,
            },
          },
          orderBy: {
            createdAt: 'asc', // Process oldest first
          },
          take: 10, // Limit per user to avoid overload
        })

        logger.info('Found suggestions for auto-approve', {
          userId: user.id,
          count: suggestions.length,
          confidenceMin,
        })

        for (const suggestion of suggestions) {
          try {
            // Approve the suggestion
            // Note: We need to call the approveSuggestion service
            // But it requires context, so we'll need to create a system context
            const event = await approveSuggestionForAutoApprove(
              suggestion.id,
              user.id
            )

            totalApproved++

            logger.info('Auto-approved suggestion', {
              suggestionId: suggestion.id,
              eventId: event.id,
              userId: user.id,
              confidence: suggestion.confidence,
            })

            // Send notification email
            if (user.settings?.emailNotifications !== false) {
              try {
                await sendSuggestionNotification(user.email, {
                  title: suggestion.title,
                  start: suggestion.start || undefined,
                  source: suggestion.source,
                  confidence: suggestion.confidence,
                })
              } catch (emailError: any) {
                logger.error('Failed to send auto-approve notification', {
                  error: emailError.message,
                  userId: user.id,
                })
              }
            }
          } catch (error: any) {
            logger.error('Failed to auto-approve suggestion', {
              error: error.message,
              suggestionId: suggestion.id,
              userId: user.id,
            })
          }
        }
      }

      logger.info('Auto-approve processing complete', {
        totalApproved,
        usersProcessed: usersWithAutoApprove.length,
      })

      return { totalApproved, usersProcessed: usersWithAutoApprove.length }
    } catch (error: any) {
      logger.error('Error in auto-approve service', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  })
}

/**
 * Approve suggestion for auto-approve (system context)
 */
async function approveSuggestionForAutoApprove(
  suggestionId: string,
  userId: string
) {
  const suggestion = await db.eventSuggestion.findUnique({
    where: {
      id: suggestionId,
      userId: userId,
    },
  })

  if (!suggestion) {
    throw new Error('Suggestion not found')
  }

  if (suggestion.status !== 'PENDING') {
    throw new Error('Suggestion is not pending')
  }

  // Create event from suggestion
  const event = await db.event.create({
    data: {
      userId: userId,
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
    where: { id: suggestionId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      eventId: event.id,
    },
  })

  // Sync to connected calendars
  const { syncToConnectedCalendars } = await import('src/lib/calendarSync')
  await syncToConnectedCalendars(event)

  // Audit log
  await audit({
    action: 'suggestion.approved',
    entityType: 'EventSuggestion',
    entityId: suggestionId,
    userId: userId,
    metadata: {
      eventId: event.id,
      title: event.title,
      autoApproved: true,
      confidence: suggestion.confidence,
    },
  })

  return event
}

