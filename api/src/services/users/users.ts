import { db } from 'src/lib/db'
import { requireAuth, getCurrentUser } from 'src/lib/auth'
import { audit } from 'src/lib/auditLogger'

export const me = async (_: any, { context }: { context: any }) => {
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    return null
  }

  return db.user.findUnique({
    where: { id: currentUser.id },
    include: {
      settings: true,
      events: {
        take: 10,
        orderBy: { start: 'desc' },
      },
      suggestions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      connectors: {
        where: { enabled: true },
      },
    },
  })
}

export const updateSettings = async (
  { input }: { input: any },
  { context }: { context: any }
) => {
  requireAuth(context)
  const currentUser = await getCurrentUser(context)
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  // Get or create settings
  const existing = await db.userSettings.findUnique({
    where: { userId: currentUser.id },
  })

  if (existing) {
    const settings = await db.userSettings.update({
      where: { userId: currentUser.id },
      data: {
        timezone: input.timezone ?? existing.timezone,
        defaultReminder: input.defaultReminder ?? existing.defaultReminder,
        autoApprove: input.autoApprove ?? existing.autoApprove,
        confidenceMin: input.confidenceMin ?? existing.confidenceMin,
      },
    })

    // Audit log
    await audit({
      action: 'settings.updated',
      entityType: 'UserSettings',
      entityId: settings.id,
    })

    return settings
  }

  const settings = await db.userSettings.create({
    data: {
      userId: currentUser.id,
      timezone: input.timezone ?? 'UTC',
      defaultReminder: input.defaultReminder ?? 30,
      autoApprove: input.autoApprove ?? false,
      confidenceMin: input.confidenceMin ?? 0.7,
    },
  })

  // Audit log
  await audit({
    action: 'settings.updated',
    entityType: 'UserSettings',
    entityId: settings.id,
  })

  return settings
}

