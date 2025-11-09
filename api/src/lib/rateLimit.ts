import { RateLimitError } from './errorHandler'
import { logger } from './logger'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

// In-memory store (use Redis in production!)
const store = new Map<string, { count: number; resetAt: number }>()

/**
 * Rate limiter middleware
 */
export const rateLimit = (config: RateLimitConfig) => {
  return async (key: string) => {
    const fullKey = `${config.keyPrefix || 'rl'}:${key}`
    const now = Date.now()
    let record = store.get(fullKey)

    // Reset if window expired
    if (!record || record.resetAt <= now) {
      record = {
        count: 0,
        resetAt: now + config.windowMs,
      }
    }

    record.count++
    store.set(fullKey, record)

    // Check limit
    if (record.count > config.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)

      logger.warn('Rate limit exceeded', {
        key,
        count: record.count,
        limit: config.maxRequests,
        retryAfter,
      })
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      )
    }

    return {
      remaining: config.maxRequests - record.count,
      resetAt: record.resetAt,
    }
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key)
    }
  }
}, 60000) // Every minute

/**
 * Rate limiters for different operations
 */
export const rateLimiters = {
  // API calls
  api: rateLimit({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    keyPrefix: 'api',
  }),

  // Event extraction (expensive operation)
  extraction: rateLimit({
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    keyPrefix: 'extract',
  }),

  // Gmail polling
  gmailPoll: rateLimit({
    maxRequests: 10,
    windowMs: 300000, // 5 minutes
    keyPrefix: 'gmail',
  }),

  // Authentication
  auth: rateLimit({
    maxRequests: 5,
    windowMs: 300000, // 5 minutes
    keyPrefix: 'auth',
  }),
}

/**
 * Get rate limit key from context
 */
export const getRateLimitKey = (context: any): string => {
  return (
    context?.currentUser?.id ||
    context?.event?.headers?.['x-forwarded-for'] ||
    context?.event?.requestContext?.identity?.sourceIp ||
    'anonymous'
  )
}

