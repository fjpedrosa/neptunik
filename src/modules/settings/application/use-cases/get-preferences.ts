/**
 * Get Preferences Use Case
 * Application layer - Business logic for retrieving user preferences
 */

import type { UserPreferences } from '../../domain/entities/user-preferences'
import type { PreferencesRepository } from '../../domain/repositories/preferences-repository'

export interface GetPreferencesInput {
  userId: string
}

export interface GetPreferencesOutput {
  preferences: UserPreferences
}

export class GetPreferencesUseCase {
  constructor(private readonly repository: PreferencesRepository) {}

  async execute(input: GetPreferencesInput): Promise<GetPreferencesOutput> {
    const { userId } = input

    if (!userId) {
      throw new Error('User ID is required')
    }

    const preferences = await this.repository.getPreferences(userId)

    return {
      preferences,
    }
  }
}
