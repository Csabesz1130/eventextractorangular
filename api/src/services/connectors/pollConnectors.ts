import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'
import { pollConnector } from './connectors'

/**
 * Background job to poll all enabled connectors
 * This should be called by a cron job or scheduler
 */
export async function pollAllConnectors() {
  const connectors = await db.connector.findMany({
    where: {
      enabled: true,
    },
    include: {
      user: {
        include: {
          settings: true,
        },
      },
    },
  })

  logger.info(`Polling ${connectors.length} connectors`)

  for (const connector of connectors) {
    try {
      // Check if it's time to poll (based on pollInterval)
      const now = new Date()
      const lastPolled = connector.lastPolled
      const pollIntervalMs = connector.pollInterval * 1000

      if (
        lastPolled &&
        now.getTime() - lastPolled.getTime() < pollIntervalMs
      ) {
        continue // Skip if not time to poll yet
      }

      // Poll the connector
      const suggestions = await pollConnector({ id: connector.id })

      logger.info(
        `Connector ${connector.id} (${connector.provider}): ${suggestions.length} new suggestions`
      )
    } catch (error) {
      logger.error(`Failed to poll connector ${connector.id}:`, error)
    }
  }
}

