/**
 * Demo Email Sender
 * 
 * This script sends test emails to a Gmail account for demo purposes.
 * 
 * Usage:
 *   ts-node scripts/demo-email-sender.ts <gmail-address>
 * 
 * Requirements:
 *   - Gmail account with App Password or OAuth
 *   - nodemailer package installed
 */

import * as nodemailer from 'nodemailer'

const GMAIL_USER = process.env.DEMO_GMAIL_USER || ''
const GMAIL_PASS = process.env.DEMO_GMAIL_PASS || '' // App Password

interface EmailTemplate {
  subject: string
  text: string
  html: string
}

const templates: Record<string, EmailTemplate> = {
  hungarian_exam: {
    subject: '11-14. heti Pulmonológia vizsgákra történő jelentkezés nyitása',
    text: `
Kedves Hallgatók!

Dékáni engedély alapján a 11-14. heti vizsgaidőszakon kívüli vizsgák meghirdetése folyamatban van. A vizsgákra való jelentkezés **2025. november 10-én hétfőn 21.00 órakor** nyílik meg.

Üdvözlettel:
Fábián Edit, KK Tüdőgyógyászati Klinika
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Kedves Hallgatók!</h2>
  
  <p>Dékáni engedély alapján a 11-14. heti vizsgaidőszakon kívüli vizsgák meghirdetése folyamatban van. A vizsgákra való jelentkezés <strong>2025. november 10-én hétfőn 21.00 órakor</strong> nyílik meg.</p>
  
  <p>Üdvözlettel:<br>
  Fábián Edit, KK Tüdőgyógyászati Klinika</p>
</div>
    `.trim(),
  },
  english_meeting: {
    subject: 'Team Standup - Monday 9:00 AM',
    text: `
Hi team,

Just a reminder about our weekly standup meeting.

When: Monday, November 11, 2025 at 9:00 AM
Where: Conference Room A
Duration: 30 minutes

Agenda:
- Sprint progress review
- Blockers discussion
- Next week planning

See you there!

Best,
John
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Team Standup Reminder</h2>
  
  <p>Hi team,</p>
  
  <p>Just a reminder about our weekly standup meeting.</p>
  
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>When:</strong> Monday, November 11, 2025 at 9:00 AM</p>
    <p><strong>Where:</strong> Conference Room A</p>
    <p><strong>Duration:</strong> 30 minutes</p>
  </div>
  
  <p><strong>Agenda:</strong></p>
  <ul>
    <li>Sprint progress review</li>
    <li>Blockers discussion</li>
    <li>Next week planning</li>
  </ul>
  
  <p>See you there!</p>
  
  <p>Best,<br>John</p>
</div>
    `.trim(),
  },
  mixed_language: {
    subject: 'Dentist Appointment - Fogorvos időpont',
    text: `
Hello,

This is a reminder for your dental appointment.

When: Wednesday, November 13, 2025 at 2:30 PM
Where: Smile Dental Clinic, Main Street 10
Duration: 1 hour

Please arrive 10 minutes early.

Üdvözlettel,
Dr. Kovács
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Dental Appointment Reminder</h2>
  
  <p>Hello,</p>
  
  <p>This is a reminder for your dental appointment.</p>
  
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>When:</strong> Wednesday, November 13, 2025 at 2:30 PM</p>
    <p><strong>Where:</strong> Smile Dental Clinic, Main Street 10</p>
    <p><strong>Duration:</strong> 1 hour</p>
  </div>
  
  <p>Please arrive 10 minutes early.</p>
  
  <p>Üdvözlettel,<br>Dr. Kovács</p>
</div>
    `.trim(),
  },
}

async function sendDemoEmail(
  to: string,
  template: EmailTemplate
): Promise<void> {
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.error('GMAIL_USER and GMAIL_PASS environment variables must be set')
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: `"EventFlow Demo" <${GMAIL_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    console.log('✅ Email sent:', info.messageId)
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message)
    throw error
  }
}

async function main() {
  const recipient = process.argv[2] || GMAIL_USER

  if (!recipient) {
    console.error('Usage: ts-node scripts/demo-email-sender.ts <gmail-address>')
    console.error('Or set DEMO_GMAIL_USER environment variable')
    process.exit(1)
  }

  console.log('📧 Sending demo emails to:', recipient)
  console.log('')

  // Send all template emails
  for (const [name, template] of Object.entries(templates)) {
    console.log(`Sending ${name}...`)
    await sendDemoEmail(recipient, template)
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2s between emails
  }

  console.log('')
  console.log('✅ All demo emails sent!')
  console.log('Check your Gmail inbox and EventFlow should detect these events.')
}

if (require.main === module) {
  main().catch(console.error)
}

export { sendDemoEmail, templates }

