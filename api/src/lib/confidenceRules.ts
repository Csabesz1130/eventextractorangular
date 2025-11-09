import { logger } from './logger'

interface ExtractResponse {
  title: string | null
  start: string | null
  confidence: number
  source: string
}

interface MessageContext {
  from: string
  subject: string
  body: string
  locale: string
}

interface UserSettings {
  confidenceMin?: number
  autoApprove?: boolean
}

/**
 * Apply confidence scoring rules to boost or reduce confidence
 */
export function applyConfidenceRules(
  extracted: ExtractResponse,
  context: MessageContext,
  userSettings?: UserSettings | null
): number {
  let confidence = extracted.confidence || 0.5
  const boosts: string[] = []

  // Domain-based confidence boost
  const fromDomain = extractDomain(context.from)
  if (fromDomain) {
    // Academic domains often send structured event emails
    if (
      fromDomain.includes('.edu') ||
      fromDomain.includes('unideb.hu') ||
      fromDomain.includes('university')
    ) {
      confidence += 0.15
      boosts.push('academic-domain')
    }

    // Known calendar/event services
    if (
      fromDomain.includes('calendar') ||
      fromDomain.includes('eventbrite') ||
      fromDomain.includes('meetup')
    ) {
      confidence += 0.2
      boosts.push('event-service-domain')
    }
  }

  // Subject-based boosts
  const subjectLower = context.subject.toLowerCase()
  const bodyLower = context.body.toLowerCase()

  // Hungarian exam keywords
  if (
    (subjectLower.includes('vizsga') || bodyLower.includes('vizsga')) &&
    (fromDomain?.includes('unideb.hu') || fromDomain?.includes('.edu'))
  ) {
    confidence += 0.2
    boosts.push('hungarian-exam-pattern')
  }

  // English exam keywords
  if (
    (subjectLower.includes('exam') || bodyLower.includes('exam')) &&
    fromDomain?.includes('.edu')
  ) {
    confidence += 0.15
    boosts.push('english-exam-pattern')
  }

  // Meeting keywords
  if (
    subjectLower.includes('meeting') ||
    subjectLower.includes('call') ||
    subjectLower.includes('appointment')
  ) {
    confidence += 0.1
    boosts.push('meeting-keywords')
  }

  // Date pattern detection boost
  // If we have a clear weekday + date pattern, boost confidence
  const weekdayPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|hétfő|kedd|szerda|csütörtök|péntek|szombat|vasárnap)/i
  const datePattern = /\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}|\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2}/
  if (weekdayPattern.test(context.body) && datePattern.test(context.body)) {
    confidence += 0.1
    boosts.push('weekday-date-pattern')
  }

  // Time pattern boost
  const timePattern = /\d{1,2}:\d{2}\s*(am|pm|óra|:)/i
  if (timePattern.test(context.body)) {
    confidence += 0.05
    boosts.push('time-pattern')
  }

  // Location boost (if location found)
  if (extracted.location) {
    confidence += 0.05
    boosts.push('location-found')
  }

  // Title quality boost
  if (extracted.title && extracted.title.length > 5 && extracted.title !== 'Untitled') {
    confidence += 0.05
    boosts.push('good-title')
  }

  // Start date found boost
  if (extracted.start) {
    confidence += 0.1
    boosts.push('start-date-found')
  } else {
    // Penalty if no date found
    confidence -= 0.15
    boosts.push('no-date-penalty')
  }

  // Cap confidence between 0.0 and 1.0
  confidence = Math.max(0.0, Math.min(1.0, confidence))

  if (boosts.length > 0) {
    logger.debug('Confidence rules applied', {
      original: extracted.confidence,
      boosted: confidence,
      boosts,
      from: context.from,
    })
  }

  return confidence
}

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string | null {
  const match = email.match(/@([^\s<>]+)/)
  return match ? match[1].toLowerCase() : null
}

/**
 * Get smart defaults for event
 */
export function getSmartDefaults(
  extracted: ExtractResponse,
  context: MessageContext
): {
  duration?: number // minutes
  title?: string
  location?: string
} {
  const defaults: any = {}

  // Default duration: 30 minutes if not specified
  if (extracted.start && !extracted.end) {
    defaults.duration = 30
  }

  // Title fallback: use first 5 words of subject
  if (!extracted.title || extracted.title === 'Untitled') {
    const subjectWords = context.subject
      .replace(/^(Re:|Fwd?:|FW:)\s*/i, '')
      .split(/\s+/)
      .slice(0, 5)
      .join(' ')
    if (subjectWords.length > 3) {
      defaults.title = subjectWords
    }
  }

  // Location guessing from body (simple pattern matching)
  if (!extracted.location) {
    const locationPatterns = [
      /(?:at|in|location|helyszín|helye):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+\s+(?:Room|Hall|Building|Terem|Terem|Épület))/i,
    ]

    for (const pattern of locationPatterns) {
      const match = context.body.match(pattern)
      if (match && match[1]) {
        defaults.location = match[1]
        break
      }
    }
  }

  return defaults
}

