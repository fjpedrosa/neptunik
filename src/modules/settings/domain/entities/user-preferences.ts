/**
 * User Preferences Entity
 * Domain layer - Core business entity for user preferences
 */

export interface NotificationPreferences {
  email: boolean
  push: boolean
  marketing: boolean
  security: boolean
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'es' | 'fr' | 'pt' | 'de'
  timezone: string
  dateFormat: string
  notifications: NotificationPreferences
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'es',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  dateFormat: 'DD/MM/YYYY',
  notifications: {
    email: true,
    push: true,
    marketing: false,
    security: true,
  },
}

/**
 * Validates user preferences
 */
export function validatePreferences(preferences: Partial<UserPreferences>): boolean {
  // Validate theme
  if (preferences.theme && !['light', 'dark', 'system'].includes(preferences.theme)) {
    return false
  }

  // Validate language
  if (preferences.language && !['en', 'es', 'fr', 'pt', 'de'].includes(preferences.language)) {
    return false
  }

  // Validate notifications if provided
  if (preferences.notifications) {
    const validKeys = ['email', 'push', 'marketing', 'security']
    for (const key in preferences.notifications) {
      if (!validKeys.includes(key)) {
        return false
      }
    }
  }

  return true
}

/**
 * Merges partial preferences with defaults
 */
export function mergePreferences(
  current: UserPreferences,
  updates: Partial<UserPreferences>
): UserPreferences {
  return {
    ...current,
    ...updates,
    notifications: {
      ...current.notifications,
      ...(updates.notifications || {}),
    },
  }
}
