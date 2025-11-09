import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

/**
 * Global Prisma client instance
 * Handles connection pooling and query logging
 */
export const db = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
})

// Log Prisma queries in development
if (process.env.NODE_ENV === 'development') {
  db.$on('query' as never, (e: any) => {
    logger.debug('Prisma query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    })
  })
}

// Graceful shutdown
const gracefulShutdown = async () => {
  await db.$disconnect()
  process.exit(0)
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
