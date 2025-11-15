/**
 * Local Storage Preferences Repository Implementation
 * Infrastructure layer - Browser localStorage adapter for preferences persistence
 */

import type { UserPreferences } from '../../domain/entities/user-preferences'
import { DEFAULT_PREFERENCES } from '../../domain/entities/user-preferences'
import type { PreferencesRepository } from '../../domain/repositories/preferences-repository'

const STORAGE_KEY = 'user_preferences'

export class LocalStoragePreferencesRepository implements PreferencesRepository {
  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
      if (!stored) {
        return DEFAULT_PREFERENCES
      }

      const parsed = JSON.parse(stored)
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        notifications: {
          ...DEFAULT_PREFERENCES.notifications,
          ...(parsed.notifications || {}),
        },
      }
    } catch (error) {
      console.error('Error reading preferences from localStorage:', error)
      return DEFAULT_PREFERENCES
    }
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const current = await this.getPreferences(userId)
      const updated = {
        ...current,
        ...preferences,
        notifications: {
          ...current.notifications,
          ...(preferences.notifications || {}),
        },
      }

      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updated))
      return updated
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error)
      throw error
    }
  }

  async resetPreferences(userId: string): Promise<UserPreferences> {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
      return DEFAULT_PREFERENCES
    } catch (error) {
      console.error('Error resetting preferences in localStorage:', error)
      throw error
    }
  }
}
