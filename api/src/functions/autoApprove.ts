import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { processAutoApprove } from 'src/services/autoApprove/autoApproveService'
import { logger } from 'src/lib/logger'

/**
 * Scheduled function to process auto-approve
 * This should be called by a cron job every minute
 * 
 * Example cron: */1 * * * * (every minute)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Auto-approve function triggered')

    const result = await processAutoApprove()

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ...result,
      }),
    }
  } catch (error: any) {
    logger.error('Error in auto-approve function', {
      error: error.message,
      stack: error.stack,
    })

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    }
  }
}

