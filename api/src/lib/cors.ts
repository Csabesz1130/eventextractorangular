/**
 * CORS configuration for API
 * Allows requests from Angular dev server and production domains
 */
export const corsConfig = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [
          process.env.WEB_URL || 'https://eventflow.app',
          /\.eventflow\.app$/,
        ]
      : [
          'http://localhost:4200',
          'http://localhost:3000',
          'http://localhost:8910',
        ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours
}

/**
 * Check if origin is allowed
 */
export const isAllowedOrigin = (origin: string): boolean => {
  const allowed = corsConfig.origin
  if (Array.isArray(allowed)) {
    return allowed.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
  }
  return false
}

