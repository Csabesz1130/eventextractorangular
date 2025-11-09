import fetch from 'node-fetch'
import { logger } from './logger'

const EXTRACTION_API_URL = process.env.EXTRACTION_API_URL || 'http://localhost:8080'
const EXTRACTION_API_KEY = process.env.EXTRACTION_API_KEY

export interface ExtractRequest {
  text: string
  source: string
  source_meta?: any
  locale?: string
  timezone: string
}

export interface ExtractResponseWithDefaults extends ExtractResponse {
  smartDefaults?: {
    duration?: number
    title?: string
    location?: string
  }
}

export interface ExtractResponse {
  title: string | null
  start: string | null
  end: string | null
  timezone: string
  location: string | null
  attendees: string[]
  description: string | null
  reminders: number[]
  recurrence: string | null
  confidence: number
  raw_text_snippet: string
  source: string
  source_meta: any
}

export async function callExtractionAPI(
  request: ExtractRequest
): Promise<ExtractResponse> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (EXTRACTION_API_KEY) {
        headers['Authorization'] = `Bearer ${EXTRACTION_API_KEY}`
      }

      const response = await fetch(`${EXTRACTION_API_URL}/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Extraction API error: ${response.status} ${errorText}`
        )
      }

      const data = await response.json()
      return data as ExtractResponse
    } catch (error) {
      lastError = error as Error
      logger.warn(
        `Extraction API attempt ${attempt}/${maxRetries} failed:`,
        error
      )

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        )
      }
    }
  }

  throw new Error(
    `Extraction API failed after ${maxRetries} attempts: ${lastError?.message}`
  )
}

