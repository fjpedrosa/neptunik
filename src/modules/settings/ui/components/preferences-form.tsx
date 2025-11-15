/**
 * Preferences Form Component
 * UI layer - Form for editing user preferences
 */

'use client'

import { useState } from 'react'
import type { UserPreferences } from '../../domain/entities/user-preferences'

export interface PreferencesFormProps {
  preferences: UserPreferences
  onSave: (preferences: Partial<UserPreferences>) => Promise<void>
  isLoading?: boolean
}

export function PreferencesForm({ preferences, onSave, isLoading = false }: PreferencesFormProps) {
  const [formData, setFormData] = useState<UserPreferences>(preferences)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSave(formData)
    } finally {
      setIsSaving(false)
    }
  }

  const handleThemeChange = (theme: UserPreferences['theme']) => {
    setFormData(prev => ({ ...prev, theme }))
  }

  const handleLanguageChange = (language: UserPreferences['language']) => {
    setFormData(prev => ({ ...prev, language }))
  }

  const handleNotificationChange = (key: keyof UserPreferences['notifications'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Theme Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">Apariencia</h3>
          <p className="text-sm text-muted-foreground">Personaliza el aspecto de la aplicación</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Tema</label>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map(theme => (
              <button
                key={theme}
                type="button"
                onClick={() => handleThemeChange(theme)}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all
                  ${formData.theme === theme
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground hover:border-primary/50'
                  }
                `}
              >
                {theme === 'light' && 'Claro'}
                {theme === 'dark' && 'Oscuro'}
                {theme === 'system' && 'Sistema'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">Idioma</h3>
          <p className="text-sm text-muted-foreground">Selecciona tu idioma preferido</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Idioma de la interfaz</label>
          <select
            value={formData.language}
            onChange={(e) => handleLanguageChange(e.target.value as UserPreferences['language'])}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="pt">Português</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">Notificaciones</h3>
          <p className="text-sm text-muted-foreground">Gestiona tus preferencias de notificaciones</p>
        </div>

        <div className="space-y-4">
          {[
            { key: 'email', label: 'Notificaciones por Email', description: 'Recibe actualizaciones por correo electrónico' },
            { key: 'push', label: 'Notificaciones Push', description: 'Recibe notificaciones en tu navegador' },
            { key: 'marketing', label: 'Comunicaciones de Marketing', description: 'Recibe noticias y ofertas especiales' },
            { key: 'security', label: 'Alertas de Seguridad', description: 'Recibe notificaciones sobre la seguridad de tu cuenta' },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between p-4 rounded-lg border border-border bg-background/50">
              <div className="flex-1">
                <label htmlFor={key} className="text-sm font-medium text-foreground cursor-pointer">
                  {label}
                </label>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  id={key}
                  role="switch"
                  aria-checked={formData.notifications[key as keyof typeof formData.notifications]}
                  onClick={() => handleNotificationChange(
                    key as keyof UserPreferences['notifications'],
                    !formData.notifications[key as keyof typeof formData.notifications]
                  )}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${formData.notifications[key as keyof typeof formData.notifications]
                      ? 'bg-primary'
                      : 'bg-muted'
                    }
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${formData.notifications[key as keyof typeof formData.notifications]
                        ? 'translate-x-6'
                        : 'translate-x-1'
                      }
                    `}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
        <button
          type="submit"
          disabled={isLoading || isSaving}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
