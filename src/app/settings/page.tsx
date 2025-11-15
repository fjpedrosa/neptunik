/**
 * Settings Page
 * Main settings page with tabs for different sections
 */

'use client'

import { useState } from 'react'
import { Settings, Bell, User } from 'lucide-react'
import { usePreferences, PreferencesForm } from '@/modules/settings'

type TabId = 'preferences' | 'account' | 'notifications'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: 'preferences', label: 'Preferencias', icon: Settings },
  { id: 'account', label: 'Cuenta', icon: User },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('preferences')
  const { preferences, updatePreferences, isLoading } = usePreferences('user-id') // TODO: Get from auth context

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-2">
            Administra tus preferencias y configuración de cuenta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                      ${isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Content Area */}
          <main className="lg:col-span-3">
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              {activeTab === 'preferences' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Preferencias</h2>
                    <p className="text-muted-foreground mt-1">
                      Personaliza tu experiencia en Neptunik
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <PreferencesForm
                      preferences={preferences}
                      onSave={updatePreferences}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              )}

              {activeTab === 'account' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Cuenta</h2>
                    <p className="text-muted-foreground mt-1">
                      Administra la información de tu cuenta
                    </p>
                  </div>

                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      La configuración de cuenta estará disponible próximamente
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Notificaciones</h2>
                    <p className="text-muted-foreground mt-1">
                      Gestiona cómo y cuándo recibir notificaciones
                    </p>
                  </div>

                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Las notificaciones se gestionan en la sección de Preferencias
                    </p>
                    <button
                      onClick={() => setActiveTab('preferences')}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Ir a Preferencias
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
