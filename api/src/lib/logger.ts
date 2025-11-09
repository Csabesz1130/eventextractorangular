/**
 * Structured logger with context support
 * Usage: logger.info('Event created', { eventId, userId })
 */

interface LogContext {
  [key: string]: any
}

class Logger {
  private redactPaths = [
    'accessToken',
    'refreshToken',
    'password',
    'OPENAI_API_KEY',
    'GOOGLE_CLIENT_SECRET',
  ]

  private redact(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    const redacted = { ...obj }
    for (const path of this.redactPaths) {
      if (redacted[path]) {
        redacted[path] = '***REDACTED***'
      }
    }
    return redacted
  }

  private formatMessage(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(this.redact(context))}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage('error', message, context))
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  child(context: LogContext) {
    return {
      info: (msg: string, ctx?: LogContext) =>
        this.info(msg, { ...context, ...ctx }),
      warn: (msg: string, ctx?: LogContext) =>
        this.warn(msg, { ...context, ...ctx }),
      error: (msg: string, ctx?: LogContext) =>
        this.error(msg, { ...context, ...ctx }),
      debug: (msg: string, ctx?: LogContext) =>
        this.debug(msg, { ...context, ...ctx }),
    }
  }
}

export const logger = new Logger()

/**
 * Create child logger with persistent context
 */
export const createContextLogger = (context: Record<string, any>) => {
  return logger.child(context)
}

/**
 * Performance timing utility
 */
export const timed = async <T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now()
  try {
    const result = await fn()
    logger.info(`${label} completed`, { duration: Date.now() - start })
    return result
  } catch (error: any) {
    logger.error(`${label} failed`, {
      duration: Date.now() - start,
      error: error.message,
    })
    throw error
  }
}
