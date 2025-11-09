import { logger } from './logger'

interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

interface EventReminderOptions {
  to: string
  event: {
    title: string
    start: Date
    location?: string
  }
  minutesBefore: number
}

/**
 * Email sender abstraction
 * TODO: Integrate with SendGrid, Mailgun, or SES in production
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Development: Just log
  if (process.env.NODE_ENV === 'development') {
    logger.info('📧 Email would be sent:', options)
    return
  }

  // Production: Implement actual email sending
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail')
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  // await sgMail.send({
  //   to: options.to,
  //   from: options.from || process.env.FROM_EMAIL,
  //   subject: options.subject,
  //   text: options.text,
  //   html: options.html,
  // })

  logger.info('Email sent', { to: options.to, subject: options.subject })
}

/**
 * Send event reminder email
 */
export const sendEventReminder = async (options: EventReminderOptions) => {
  const { event, minutesBefore } = options

  const timeText =
    minutesBefore >= 60
      ? `${Math.floor(minutesBefore / 60)} hour${minutesBefore >= 120 ? 's' : ''}`
      : `${minutesBefore} minutes`

  await sendEmail({
    to: options.to,
    subject: `Reminder: ${event.title}`,
    text: `
Reminder for your event in ${timeText}:

${event.title}

When: ${event.start.toLocaleString()}

${event.location ? `Where: ${event.location}` : ''}

View in EventFlow: ${process.env.WEB_URL || 'http://localhost:4200'}/calendar

    `.trim(),
    html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>🔔 Event Reminder</h2>
  <p>Your event starts in <strong>${timeText}</strong>:</p>
  
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <h3 style="margin: 0 0 8px 0;">${event.title}</h3>
    <p style="margin: 4px 0;">📅 ${event.start.toLocaleString()}</p>
    ${event.location ? `<p style="margin: 4px 0;">📍 ${event.location}</p>` : ''}
  </div>
  
  <a href="${process.env.WEB_URL || 'http://localhost:4200'}/calendar" style="display: inline-block; background: #6a9eff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    View in EventFlow
  </a>
</div>
    `.trim(),
  })
}

/**
 * Send new suggestion notification
 */
export const sendSuggestionNotification = async (
  to: string,
  suggestion: {
    title: string
    start?: Date
    source: string
    confidence: number
  }
) => {
  await sendEmail({
    to,
    subject: `New event detected: ${suggestion.title}`,
    text: `
EventFlow detected a new event:

${suggestion.title}

${suggestion.start ? `When: ${suggestion.start.toLocaleString()}` : 'Time: Not specified'}

Source: ${suggestion.source}

Confidence: ${Math.round(suggestion.confidence * 100)}%

Review it now: ${process.env.WEB_URL || 'http://localhost:4200'}/inbox

    `.trim(),
    html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>🎯 New Event Detected</h2>
  
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <h3 style="margin: 0 0 8px 0;">${suggestion.title}</h3>
    ${suggestion.start ? `<p style="margin: 4px 0;">📅 ${suggestion.start.toLocaleString()}</p>` : ''}
    <p style="margin: 4px 0;">📧 Source: ${suggestion.source}</p>
    <p style="margin: 4px 0;">🎯 Confidence: ${Math.round(suggestion.confidence * 100)}%</p>
  </div>
  
  <a href="${process.env.WEB_URL || 'http://localhost:4200'}/inbox" style="display: inline-block; background: #6a9eff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Review in Inbox
  </a>
</div>
    `.trim(),
  })
}

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (to: string, name?: string) => {
  await sendEmail({
    to,
    subject: 'Welcome to EventFlow! 🎉',
    text: `
Hi${name ? ` ${name}` : ''}!

Welcome to EventFlow - your AI-powered event assistant.

Here's what you can do:

• Extract events from emails, SMS, and web pages
• Review AI suggestions in your inbox
• Approve events to add them to your calendar
• Connect Gmail for automatic event detection

Get started: ${process.env.WEB_URL || 'http://localhost:4200'}/inbox

Happy scheduling!

The EventFlow Team

    `.trim(),
    html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>Welcome to EventFlow! 🎉</h1>
  
  <p>Hi${name ? ` ${name}` : ''}!</p>
  
  <p>We're excited to have you on board. EventFlow uses AI to automatically extract events from your communications and help you stay organized.</p>
  
  <h3>Quick Start Guide:</h3>
  <ul>
    <li>📥 Extract events from emails, SMS, and web pages</li>
    <li>📋 Review AI suggestions in your inbox</li>
    <li>✅ Approve events to add them to your calendar</li>
    <li>🔗 Connect Gmail for automatic event detection</li>
  </ul>
  
  <a href="${process.env.WEB_URL || 'http://localhost:4200'}/inbox" style="display: inline-block; background: #6a9eff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
    Get Started
  </a>
  
  <p style="color: #666; font-size: 14px; margin-top: 32px;">
    Happy scheduling!<br>
    The EventFlow Team
  </p>
</div>
    `.trim(),
  })
}

