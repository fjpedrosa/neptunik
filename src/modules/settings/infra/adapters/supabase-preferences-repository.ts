/**
 * Supabase Preferences Repository Implementation
 * Infrastructure layer - Supabase adapter for preferences persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserPreferences } from '../../domain/entities/user-preferences'
import { DEFAULT_PREFERENCES } from '../../domain/entities/user-preferences'
import type { PreferencesRepository } from '../../domain/repositories/preferences-repository'
import { PreferencesNotFoundError } from '../../domain/repositories/preferences-repository'

export class SupabasePreferencesRepository implements PreferencesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If preferences don't exist, return defaults
        if (error.code === 'PGRST116') {
          return DEFAULT_PREFERENCES
        }
        throw error
      }

      if (!data) {
        return DEFAULT_PREFERENCES
      }

      return {
        theme: data.theme || DEFAULT_PREFERENCES.theme,
        language: data.language || DEFAULT_PREFERENCES.language,
        timezone: data.timezone || DEFAULT_PREFERENCES.timezone,
        dateFormat: data.date_format || DEFAULT_PREFERENCES.dateFormat,
        notifications: {
          email: data.notifications_email ?? DEFAULT_PREFERENCES.notifications.email,
          push: data.notifications_push ?? DEFAULT_PREFERENCES.notifications.push,
          marketing: data.notifications_marketing ?? DEFAULT_PREFERENCES.notifications.marketing,
          security: data.notifications_security ?? DEFAULT_PREFERENCES.notifications.security,
        },
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      throw new PreferencesNotFoundError(userId)
    }
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const updateData: any = {}

      if (preferences.theme) updateData.theme = preferences.theme
      if (preferences.language) updateData.language = preferences.language
      if (preferences.timezone) updateData.timezone = preferences.timezone
      if (preferences.dateFormat) updateData.date_format = preferences.dateFormat

      if (preferences.notifications) {
        if (preferences.notifications.email !== undefined) updateData.notifications_email = preferences.notifications.email
        if (preferences.notifications.push !== undefined) updateData.notifications_push = preferences.notifications.push
        if (preferences.notifications.marketing !== undefined) updateData.notifications_marketing = preferences.notifications.marketing
        if (preferences.notifications.security !== undefined) updateData.notifications_security = preferences.notifications.security
      }

      const { data, error } = await this.supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            ...updateData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single()

      if (error) throw error

      if (!data) {
        throw new Error('Failed to update preferences')
      }

      return {
        theme: data.theme,
        language: data.language,
        timezone: data.timezone,
        dateFormat: data.date_format,
        notifications: {
          email: data.notifications_email,
          push: data.notifications_push,
          marketing: data.notifications_marketing,
          security: data.notifications_security,
        },
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      throw error
    }
  }

  async resetPreferences(userId: string): Promise<UserPreferences> {
    return this.updatePreferences(userId, DEFAULT_PREFERENCES)
  }
}
