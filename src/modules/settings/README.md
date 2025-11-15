# Settings Module

This module handles user settings and preferences for the Neptunik platform.

## Overview

The Settings module follows Clean Architecture principles with clear separation of concerns:

- **Domain**: Core business entities and repository interfaces
- **Application**: Use cases and business logic
- **Infrastructure**: External adapters (HTTP Backend API, LocalStorage)
- **UI**: React components and hooks

## Features

- User preferences management (theme, language, timezone, notifications)
- Multiple storage adapters (HTTP Backend API with Prisma, LocalStorage fallback)
- Type-safe preferences validation
- React hooks for easy integration
- Backend agnostic design (can point to any API endpoint)

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
import { createHttpPreferencesRepository } from '@/modules/settings'

export async function GET(request: Request) {
  const repository = createHttpPreferencesRepository({
    baseUrl: process.env.BACKEND_API_URL
  })

  const preferences = await repository.getPreferences('user-id')

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
- `HttpPreferencesRepository`: Calls backend API with Prisma for persistence
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

- React 18+
- TypeScript 5+
- Backend API with Prisma (separate service)

## Backend API Requirements

The backend API should implement these endpoints:

- `GET /users/:userId/preferences` - Retrieve user preferences
- `PUT /users/:userId/preferences` - Update user preferences
- `DELETE /users/:userId/preferences` - Reset to defaults

Expected response format:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "theme": "dark",
      "language": "es",
      "timezone": "UTC",
      "dateFormat": "DD/MM/YYYY",
      "notifications": {
        "email": true,
        "push": true,
        "marketing": false,
        "security": true
      }
    }
  }
}
```

## Future Enhancements

- [ ] Preferences export/import functionality
- [ ] Preferences history/versioning
- [ ] Real-time preferences sync across devices
- [ ] Advanced notification scheduling
