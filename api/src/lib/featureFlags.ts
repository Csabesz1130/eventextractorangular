import { logger } from './logger'

export type FeatureFlag =
  | 'gmail_connector'
  | 'outlook_connector'
  | 'sms_connector'
  | 'calendar_view'
  | 'auto_approve'
  | 'email_notifications'
  | 'batch_operations'
  | 'chrome_extension'

interface FeatureFlagConfig {
  enabled: boolean
  rolloutPercentage?: number // 0-100
  allowedUsers?: string[]
  allowedEmails?: string[]
}

const defaultFlags: Record<FeatureFlag, FeatureFlagConfig> = {
  gmail_connector: { enabled: true },
  outlook_connector: { enabled: false },
  sms_connector: { enabled: false },
  calendar_view: { enabled: true },
  auto_approve: { enabled: true },
  email_notifications: { enabled: true },
  batch_operations: { enabled: true },
  chrome_extension: { enabled: false, rolloutPercentage: 10 },
}

/**
 * Check if feature is enabled for user
 */
export const isFeatureEnabled = async (
  flag: FeatureFlag,
  userId?: string,
  userEmail?: string
): Promise<boolean> => {
  const config = defaultFlags[flag]
  if (!config) {
    logger.warn(`Unknown feature flag: ${flag}`)
    return false
  }

  // Feature globally disabled
  if (!config.enabled) {
    return false
  }

  // Check user allowlist
  if (config.allowedUsers && userId) {
    return config.allowedUsers.includes(userId)
  }

  if (config.allowedEmails && userEmail) {
    return config.allowedEmails.includes(userEmail)
  }

  // Check rollout percentage
  if (config.rolloutPercentage !== undefined && userId) {
    // Consistent hash-based rollout
    const hash = hashUserId(userId)
    const bucket = hash % 100
    return bucket < config.rolloutPercentage
  }

  return true
}

/**
 * Get all enabled features for user
 */
export const getEnabledFeatures = async (
  userId?: string,
  userEmail?: string
): Promise<FeatureFlag[]> => {
  const enabled: FeatureFlag[] = []

  for (const flag of Object.keys(defaultFlags) as FeatureFlag[]) {
    if (await isFeatureEnabled(flag, userId, userEmail)) {
      enabled.push(flag)
    }
  }

  return enabled
}

/**
 * Simple hash function for consistent rollout
 */
function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Update feature flag (for admin panel)
 */
export const updateFeatureFlag = async (
  flag: FeatureFlag,
  config: Partial<FeatureFlagConfig>
) => {
  defaultFlags[flag] = {
    ...defaultFlags[flag],
    ...config,
  }
  logger.info('Feature flag updated', { flag, config })
}

