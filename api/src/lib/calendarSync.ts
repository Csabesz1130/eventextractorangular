import { db } from './db'
import { logger } from './logger'
import { getGmailClient } from './gmail'
import { generateICSBuffer } from './icsGenerator'
import { sendEmail } from './emailSender'

export async function syncToConnectedCalendars(event: any) {
  const user = await db.user.findUnique({
    where: { id: event.userId },
    include: {
      connectors: {
        where: {
          enabled: true,
        },
      },
    },
  })

  if (!user || !user.connectors.length) {
    return
  }

  for (const connector of user.connectors) {
    try {
      if (connector.provider === 'GOOGLE_CALENDAR') {
        await createGoogleCalendarEvent(event, connector)
      } else if (connector.provider === 'APPLE_CALENDAR') {
        await sendAppleCalendarICS(event, user.email)
      }
      // Add other calendar providers here (Outlook, etc.)
    } catch (error) {
      logger.error(`Failed to sync event to ${connector.provider}:`, error)
    }
  }
}

async function createGoogleCalendarEvent(event: any, connector: any) {
  try {
    const calendar = await getGmailClient(connector)
    if (!calendar) {
      return
    }

    const calendarEvent = {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      start: {
        dateTime: event.start,
        timeZone: event.timezone,
      },
      end: {
        dateTime: event.end || event.start,
        timeZone: event.timezone,
      },
      attendees: event.attendees.map((email: string) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: event.reminders.map((minutes: number) => ({
          method: 'email',
          minutes,
        })),
      },
    }

    const created = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
    })

    // Update event with Google Calendar ID
    await db.event.update({
      where: { id: event.id },
      data: { googleEventId: created.data.id },
    })

    logger.info(`Event synced to Google Calendar: ${created.data.id}`)
  } catch (error) {
    logger.error('Failed to create Google Calendar event:', error)
    throw error
  }
}

export async function refreshGoogleToken(connector: any) {
  // TODO: Implement token refresh logic
  // This would use the refresh token to get a new access token
  logger.warn('Token refresh not yet implemented')
  return connector
}

/**
 * Send ICS file to user's email for Apple Calendar integration
 */
async function sendAppleCalendarICS(event: any, userEmail: string) {
  try {
    const icsBuffer = generateICSBuffer({
      id: event.id,
      title: event.title,
      description: event.description,
      start: new Date(event.start),
      end: event.end ? new Date(event.end) : undefined,
      timezone: event.timezone,
      location: event.location,
      attendees: event.attendees || [],
      reminders: event.reminders || [30],
    })

    // Convert buffer to base64 for email attachment
    const icsBase64 = icsBuffer.toString('base64')

    await sendEmail({
      to: userEmail,
      subject: `New Event: ${event.title}`,
      text: `
A new event has been added to your calendar:

${event.title}
${event.start ? new Date(event.start).toLocaleString() : 'Date TBD'}
${event.location ? `Location: ${event.location}` : ''}

An ICS file is attached. Open it to add to your Apple Calendar.

View in EventFlow: ${process.env.WEB_URL || 'http://localhost:4200'}/calendar
      `.trim(),
      html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>New Event Added</h2>
  
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <h3 style="margin: 0 0 8px 0;">${event.title}</h3>
    ${event.start ? `<p style="margin: 4px 0;">📅 ${new Date(event.start).toLocaleString()}</p>` : ''}
    ${event.location ? `<p style="margin: 4px 0;">📍 ${event.location}</p>` : ''}
  </div>
  
  <p>An ICS file is attached. Open it on your iPhone or Mac to add to your Apple Calendar.</p>
  
  <a href="${process.env.WEB_URL || 'http://localhost:4200'}/calendar" style="display: inline-block; background: #6a9eff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
    View in EventFlow
  </a>
</div>
      `.trim(),
      // Note: In a real implementation, you'd attach the ICS file
      // This requires a proper email service integration
    })

    logger.info('Apple Calendar ICS sent', {
      eventId: event.id,
      userEmail,
    })
  } catch (error: any) {
    logger.error('Failed to send Apple Calendar ICS', {
      error: error.message,
      eventId: event.id,
    })
    throw error
  }
}

