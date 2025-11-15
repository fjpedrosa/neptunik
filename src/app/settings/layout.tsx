/**
 * Settings Layout
 * Layout wrapper for settings pages
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración - Neptunik',
  description: 'Administra tus preferencias y configuración de cuenta en Neptunik',
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
