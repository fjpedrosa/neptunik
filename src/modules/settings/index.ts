/**
 * Settings Module Exports
 */

// Domain entities
export type { UserPreferences, NotificationPreferences } from './domain/entities/user-preferences'
export { DEFAULT_PREFERENCES, validatePreferences, mergePreferences } from './domain/entities/user-preferences'

// Domain repositories
export type { PreferencesRepository } from './domain/repositories/preferences-repository'
export {
  PreferencesNotFoundError,
  PreferencesValidationError,
} from './domain/repositories/preferences-repository'

// Application use cases
export { GetPreferencesUseCase } from './application/use-cases/get-preferences'
export type { GetPreferencesInput, GetPreferencesOutput } from './application/use-cases/get-preferences'
export { UpdatePreferencesUseCase } from './application/use-cases/update-preferences'
export type { UpdatePreferencesInput, UpdatePreferencesOutput } from './application/use-cases/update-preferences'

// Infrastructure adapters
export { HttpPreferencesRepository, createHttpPreferencesRepository } from './infra/adapters/http-preferences-repository'
export { LocalStoragePreferencesRepository } from './infra/adapters/local-storage-preferences-repository'

// UI hooks
export { usePreferences } from './ui/hooks/use-preferences'
export type { UsePreferencesResult } from './ui/hooks/use-preferences'

// UI components
export { PreferencesForm } from './ui/components/preferences-form'
export type { PreferencesFormProps } from './ui/components/preferences-form'
