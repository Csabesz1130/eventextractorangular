import ical, { ICalCalendar, ICalEvent } from 'ical-generator'
import { logger } from './logger'

interface EventData {
  id: string
  title: string
  description?: string | null
  start: Date
  end?: Date | null
  timezone: string
  location?: string | null
  attendees?: string[]
  reminders?: number[]
}

/**
 * Generate ICS file for Apple Calendar integration
 */
export function generateICS(event: EventData): string {
  try {
    const calendar = ical({ name: 'EventFlow Events' })

    const icalEvent: ICalEvent = {
      start: event.start,
      end: event.end || event.start,
      timezone: event.timezone,
      summary: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      url: `${process.env.WEB_URL || 'http://localhost:4200'}/calendar`,
      organizer: {
        name: 'EventFlow',
        email: process.env.FROM_EMAIL || 'noreply@eventflow.app',
      },
    }

    // Add attendees
    if (event.attendees && event.attendees.length > 0) {
      icalEvent.attendees = event.attendees.map((email) => ({
        email,
        rsvp: true,
      }))
    }

    // Add reminders
    if (event.reminders && event.reminders.length > 0) {
      icalEvent.alarms = event.reminders.map((minutes) => ({
        type: 'display',
        trigger: minutes * 60, // Convert minutes to seconds
      }))
    }

    calendar.createEvent(icalEvent)

    const icsString = calendar.toString()

    logger.debug('ICS file generated', {
      eventId: event.id,
      title: event.title,
    })

    return icsString
  } catch (error: any) {
    logger.error('Failed to generate ICS file', {
      error: error.message,
      eventId: event.id,
    })
    throw error
  }
}

/**
 * Generate ICS file and return as Buffer for email attachment
 */
export function generateICSBuffer(event: EventData): Buffer {
  const icsString = generateICS(event)
  return Buffer.from(icsString, 'utf-8')
}

