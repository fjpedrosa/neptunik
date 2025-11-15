/**
 * Preferences Repository Interface
 * Domain layer - Interface for preferences data persistence
 */

import type { UserPreferences } from '../entities/user-preferences'

export interface PreferencesRepository {
  /**
   * Get user preferences by user ID
   */
  getPreferences(userId: string): Promise<UserPreferences>

  /**
   * Update user preferences
   */
  updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>

  /**
   * Reset preferences to defaults
   */
  resetPreferences(userId: string): Promise<UserPreferences>
}

export class PreferencesNotFoundError extends Error {
  constructor(userId: string) {
    super(`Preferences not found for user: ${userId}`)
    this.name = 'PreferencesNotFoundError'
  }
}

export class PreferencesValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PreferencesValidationError'
  }
}
