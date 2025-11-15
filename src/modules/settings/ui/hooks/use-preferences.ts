/**
 * usePreferences Hook
 * UI layer - React hook for managing user preferences
 */

'use client'

import { useEffect, useState } from 'react'
import type { UserPreferences } from '../../domain/entities/user-preferences'
import { DEFAULT_PREFERENCES } from '../../domain/entities/user-preferences'

export interface UsePreferencesResult {
  preferences: UserPreferences
  isLoading: boolean
  error: Error | null
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
  resetPreferences: () => Promise<void>
}

export function usePreferences(userId?: string): UsePreferencesResult {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    fetchPreferences()
  }, [userId])

  const fetchPreferences = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/preferences')

      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()
      setPreferences(data.preferences || DEFAULT_PREFERENCES)
    } catch (err) {
      console.error('Error fetching preferences:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setPreferences(DEFAULT_PREFERENCES)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!userId) {
      throw new Error('User ID is required')
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: updates }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const data = await response.json()
      setPreferences(data.preferences)
    } catch (err) {
      console.error('Error updating preferences:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resetPreferences = async () => {
    if (!userId) {
      throw new Error('User ID is required')
    }

    try {
      setIsLoading(true)
      setError(null)

      await updatePreferences(DEFAULT_PREFERENCES)
    } catch (err) {
      console.error('Error resetting preferences:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    resetPreferences,
  }
}
