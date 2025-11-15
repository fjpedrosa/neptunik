/**
 * HTTP Preferences Repository Implementation
 * Infrastructure layer - HTTP adapter for calling backend API with Prisma
 */

import type { UserPreferences } from '../../domain/entities/user-preferences'
import { DEFAULT_PREFERENCES } from '../../domain/entities/user-preferences'
import type { PreferencesRepository } from '../../domain/repositories/preferences-repository'
import { PreferencesNotFoundError } from '../../domain/repositories/preferences-repository'
import { apiConfig } from '@/shared/config/api.config'

interface BackendApiConfig {
  baseUrl: string
  timeout?: number
  headers?: Record<string, string>
}

/**
 * HTTP client for making requests to the backend API
 */
class HttpClient {
  constructor(private readonly config: BackendApiConfig) {}

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options?.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async post<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options?.headers,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options?.headers,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options?.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }
}

/**
 * HTTP Repository implementation for user preferences
 * Calls the backend API which uses Prisma for database operations
 */
export class HttpPreferencesRepository implements PreferencesRepository {
  private readonly httpClient: HttpClient

  constructor(config?: Partial<BackendApiConfig>) {
    const baseUrl = config?.baseUrl || process.env.NEXT_PUBLIC_BACKEND_API_URL || apiConfig.baseUrl

    this.httpClient = new HttpClient({
      baseUrl,
      timeout: config?.timeout || 30000,
      headers: config?.headers,
    })
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await this.httpClient.get<{
        success: boolean
        data: {
          preferences: UserPreferences
        }
      }>(`/users/${userId}/preferences`)

      if (!response.success || !response.data) {
        return DEFAULT_PREFERENCES
      }

      return response.data.preferences || DEFAULT_PREFERENCES
    } catch (error) {
      console.error('Error fetching preferences from backend:', error)

      // Return defaults instead of failing
      return DEFAULT_PREFERENCES
    }
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await this.httpClient.put<{
        success: boolean
        data: {
          preferences: UserPreferences
        }
      }>(`/users/${userId}/preferences`, {
        preferences,
      })

      if (!response.success || !response.data) {
        throw new Error('Failed to update preferences')
      }

      return response.data.preferences
    } catch (error) {
      console.error('Error updating preferences on backend:', error)
      throw error
    }
  }

  async resetPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await this.httpClient.delete<{
        success: boolean
        data: {
          preferences: UserPreferences
        }
      }>(`/users/${userId}/preferences`)

      if (!response.success || !response.data) {
        throw new Error('Failed to reset preferences')
      }

      return response.data.preferences || DEFAULT_PREFERENCES
    } catch (error) {
      console.error('Error resetting preferences on backend:', error)
      throw error
    }
  }
}

/**
 * Factory function to create HTTP preferences repository
 */
export function createHttpPreferencesRepository(config?: Partial<BackendApiConfig>): HttpPreferencesRepository {
  return new HttpPreferencesRepository(config)
}
