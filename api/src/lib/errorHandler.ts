import { logger } from './logger'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public meta?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, meta?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', meta)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      404,
      'NOT_FOUND',
      { resource, id }
    )
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

export class ExtractionError extends AppError {
  constructor(message: string, meta?: Record<string, any>) {
    super(message, 500, 'EXTRACTION_FAILED', meta)
  }
}

/**
 * Global error handler for GraphQL
 */
export const formatError = (error: any) => {
  // Log error with context
  logger.error('GraphQL error', {
    message: error.message,
    code: error.extensions?.code,
    path: error.path,
    locations: error.locations,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  })

  // Don't expose internal errors in production
  if (
    process.env.NODE_ENV === 'production' &&
    error.extensions?.code === 'INTERNAL_SERVER_ERROR'
  ) {
    return {
      message: 'An internal error occurred',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    }
  }

  return error
}

/**
 * Async error wrapper for services
 */
export const catchAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => {
  return ((...args: Parameters<T>) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      if (error instanceof AppError) {
        throw error
      }

      // Wrap unexpected errors
      logger.error('Unexpected error', {
        error: error.message,
        stack: error.stack,
      })

      throw new AppError(
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred',
        500,
        'INTERNAL_SERVER_ERROR'
      )
    })
  }) as T
}

