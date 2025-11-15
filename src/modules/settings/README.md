# Settings Module

This module handles user settings and preferences for the Neptunik platform.

## Overview

The Settings module follows Clean Architecture principles with clear separation of concerns:

- **Domain**: Core business entities and repository interfaces
- **Application**: Use cases and business logic
- **Infrastructure**: External adapters (Supabase, LocalStorage)
- **UI**: React components and hooks

## Features

- User preferences management (theme, language, timezone, notifications)
- Multiple storage adapters (Supabase, LocalStorage)
- Type-safe preferences validation
- React hooks for easy integration

## Usage

### In a React Component

```tsx
import { usePreferences } from '@/modules/settings'

function SettingsPage() {
  const { preferences, updatePreferences, isLoading } = usePreferences(userId)

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updatePreferences({ theme })
  }

  return (
    <div>
      <h1>Current Theme: {preferences.theme}</h1>
      <button onClick={() => handleThemeChange('dark')}>
        Switch to Dark Mode
      </button>
    </div>
  )
}
```

### In an API Route

```ts
import { GetPreferencesUseCase, SupabasePreferencesRepository } from '@/modules/settings'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const repository = new SupabasePreferencesRepository(supabase)
  const useCase = new GetPreferencesUseCase(repository)

  const { preferences } = await useCase.execute({ userId: 'user-id' })

  return Response.json({ preferences })
}
```

## Architecture

### Domain Layer

**Entities:**
- `UserPreferences`: Core preferences entity with validation

**Repositories:**
- `PreferencesRepository`: Interface for data persistence

### Application Layer

**Use Cases:**
- `GetPreferencesUseCase`: Retrieve user preferences
- `UpdatePreferencesUseCase`: Update user preferences with validation

### Infrastructure Layer

**Adapters:**
- `SupabasePreferencesRepository`: PostgreSQL persistence via Supabase
- `LocalStoragePreferencesRepository`: Browser storage fallback

### UI Layer

**Hooks:**
- `usePreferences`: React hook for preferences management

**Components:**
- `PreferencesForm`: Complete preferences editing form

## Data Model

### UserPreferences

```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'es' | 'fr' | 'pt' | 'de'
  timezone: string
  dateFormat: string
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
    security: boolean
  }
}
```

## Testing

The module includes comprehensive testing across all layers:

- Domain entity validation
- Use case business logic
- Repository implementations
- React hooks and components

Run tests with:

```bash
npm run test:domain
npm run test:component
```

## Dependencies

- `@supabase/supabase-js`: Database client
- React 18+
- TypeScript 5+

## Migration

If migrating from legacy preferences storage:

1. Run the Supabase migration to create the `user_preferences` table
2. Use the `LocalStoragePreferencesRepository` as a fallback during migration
3. Gradually migrate users to Supabase storage

## Future Enhancements

- [ ] Preferences export/import functionality
- [ ] Preferences history/versioning
- [ ] Real-time preferences sync across devices
- [ ] Advanced notification scheduling
