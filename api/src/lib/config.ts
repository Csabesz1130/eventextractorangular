export const config = {
  // App
  nodeEnv: process.env.NODE_ENV || 'development',
  webUrl: process.env.WEB_URL || 'http://localhost:4200',
  apiUrl: process.env.API_URL || 'http://localhost:8910',

  // Extraction Service
  extractionApiUrl:
    process.env.EXTRACTION_API_URL || 'http://localhost:8080',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:8910/auth/google/callback',

  // Email
  fromEmail: process.env.FROM_EMAIL || 'noreply@eventflow.app',
  sendgridApiKey: process.env.SENDGRID_API_KEY,

  // Feature Flags
  enableEmailNotifications:
    process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  enableAutoApprove: process.env.ENABLE_AUTO_APPROVE === 'true',

  // Rate Limiting
  rateLimitMaxRequests: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || '100'
  ),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const

/**
 * Validate required environment variables
 */
export const validateConfig = () => {
  const required = ['DATABASE_URL']

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}

