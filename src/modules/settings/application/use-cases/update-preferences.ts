/**
 * Update Preferences Use Case
 * Application layer - Business logic for updating user preferences
 */

import type { UserPreferences } from '../../domain/entities/user-preferences'
import { validatePreferences, mergePreferences } from '../../domain/entities/user-preferences'
import type { PreferencesRepository } from '../../domain/repositories/preferences-repository'
import { PreferencesValidationError } from '../../domain/repositories/preferences-repository'

export interface UpdatePreferencesInput {
  userId: string
  preferences: Partial<UserPreferences>
}

export interface UpdatePreferencesOutput {
  preferences: UserPreferences
}

export class UpdatePreferencesUseCase {
  constructor(private readonly repository: PreferencesRepository) {}

  async execute(input: UpdatePreferencesInput): Promise<UpdatePreferencesOutput> {
    const { userId, preferences } = input

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Validate preferences
    if (!validatePreferences(preferences)) {
      throw new PreferencesValidationError('Invalid preferences provided')
    }

    // Get current preferences
    const currentPreferences = await this.repository.getPreferences(userId)

    // Merge with new preferences
    const mergedPreferences = mergePreferences(currentPreferences, preferences)

    // Update preferences
    const updatedPreferences = await this.repository.updatePreferences(userId, mergedPreferences)

    return {
      preferences: updatedPreferences,
    }
  }
}
