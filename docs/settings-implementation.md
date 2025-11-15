# Settings & Preferences Implementation Guide

## Overview

This document describes the implementation of the Settings and Preferences feature for Neptunik.

## What Was Implemented

### 1. Settings Module (`src/modules/settings/`)

Following Clean Architecture principles:

- **Domain Layer**
  - `UserPreferences` entity with validation
  - `PreferencesRepository` interface
  - Error classes for domain exceptions

- **Application Layer**
  - `GetPreferencesUseCase` - Retrieve user preferences
  - `UpdatePreferencesUseCase` - Update preferences with validation

- **Infrastructure Layer**
  - `SupabasePreferencesRepository` - PostgreSQL persistence
  - `LocalStoragePreferencesRepository` - Browser storage fallback

- **UI Layer**
  - `usePreferences` hook - React hook for preferences management
  - `PreferencesForm` component - Complete preferences editing form

### 2. Settings Page (`/settings`)

- Tab-based interface with sections:
  - **Preferences** - Theme, language, and notification settings
  - **Account** - Account management (placeholder)
  - **Notifications** - Notification preferences (redirects to Preferences)

- Responsive design with sidebar navigation
- Full Tailwind CSS styling (no custom CSS files)

### 3. API Endpoints

- **GET `/api/preferences`** - Retrieve user preferences
- **PUT `/api/preferences`** - Update user preferences
- **GET `/api/realtime/events`** - Server-Sent Events for real-time updates

### 4. Database Migration

- Supabase migration: `20250115000000_create_user_preferences.sql`
- Table: `user_preferences`
- Row Level Security (RLS) policies enabled
- Auto-updating timestamps

## Setup Instructions

### 1. Apply Database Migration

```bash
# Run the Supabase migration
npx supabase migration up

# Or if using Supabase CLI locally
supabase db push
```

### 2. Verify Database Schema

The `user_preferences` table should have:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `theme` (text: 'light', 'dark', 'system')
- `language` (text: 'en', 'es', 'fr', 'pt', 'de')
- `timezone` (text)
- `date_format` (text)
- `notifications_email` (boolean)
- `notifications_push` (boolean)
- `notifications_marketing` (boolean)
- `notifications_security` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3. Test the Implementation

#### Manual Testing

1. **Navigate to Settings Page**
   ```
   https://www.neptunik.com/settings
   ```

2. **Test Preferences Tab**
   - Change theme (Light/Dark/System)
   - Change language
   - Toggle notification preferences
   - Click "Guardar cambios"
   - Verify success message

3. **Test API Endpoints**
   ```bash
   # Get preferences
   curl -X GET https://www.neptunik.com/api/preferences \
     -H "Authorization: Bearer YOUR_TOKEN"

   # Update preferences
   curl -X PUT https://www.neptunik.com/api/preferences \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"preferences":{"theme":"dark","language":"es"}}'
   ```

#### Automated Testing

```bash
# Run unit tests
npm run test -- src/modules/settings

# Run E2E tests (if configured)
npm run test:e2e -- settings
```

## Usage Examples

### In a React Component

```tsx
import { usePreferences } from '@/modules/settings'

function MyComponent() {
  const { preferences, updatePreferences, isLoading } = usePreferences(userId)

  const handleThemeChange = async () => {
    await updatePreferences({ theme: 'dark' })
  }

  return (
    <div>
      <p>Current theme: {preferences.theme}</p>
      <button onClick={handleThemeChange}>Switch to Dark</button>
    </div>
  )
}
```

### In an API Route

```ts
import { GetPreferencesUseCase, SupabasePreferencesRepository } from '@/modules/settings'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const repo = new SupabasePreferencesRepository(supabase)
  const useCase = new GetPreferencesUseCase(repo)

  const result = await useCase.execute({ userId: 'user-id' })
  return Response.json(result)
}
```

## Integration Points

### 1. User Menu

The user menu already has a link to `/settings`:

```tsx
// src/components/ui/user-menu.tsx
{
  id: 'settings',
  label: 'Settings',
  icon: Settings,
  path: '/settings'  // ✓ Already configured
}
```

### 2. Redux Integration

The existing `ui-slice.ts` can be synchronized with user preferences:

```tsx
import { usePreferences } from '@/modules/settings'
import { setTheme } from '@/shared/state/slices/ui-slice'
import { useAppDispatch } from '@/shared/state/hooks'

function SettingsSync() {
  const dispatch = useAppDispatch()
  const { preferences } = usePreferences(userId)

  useEffect(() => {
    dispatch(setTheme(preferences.theme))
  }, [preferences.theme])
}
```

## Troubleshooting

### Error: "GET /api/preferences 500"

**Cause:** Database table doesn't exist or RLS policies are blocking access

**Solution:**
1. Verify migration was applied: `supabase db push`
2. Check user is authenticated
3. Verify RLS policies allow user access

### Error: "Failed to fetch preferences"

**Cause:** User not authenticated or session expired

**Solution:**
1. Check authentication status
2. Refresh user session
3. Verify Supabase client configuration

### Preferences Not Saving

**Cause:** Validation error or database constraints

**Solution:**
1. Check console for validation errors
2. Verify preference values match allowed types
3. Check database constraints in migration

## Future Enhancements

- [ ] Real-time synchronization across devices using Supabase Realtime
- [ ] Preferences export/import functionality
- [ ] Preferences history and versioning
- [ ] Advanced notification scheduling
- [ ] Two-factor authentication preferences
- [ ] Privacy and data management settings

## Files Modified/Created

### New Files

- `src/modules/settings/` (entire module)
- `src/app/settings/page.tsx`
- `src/app/settings/layout.tsx`
- `src/app/api/preferences/route.ts`
- `src/app/api/realtime/events/route.ts`
- `supabase/migrations/20250115000000_create_user_preferences.sql`
- `docs/settings-implementation.md`

### Files Referenced (Not Modified)

- `src/components/ui/user-menu.tsx` (already has /settings link)
- `src/shared/state/slices/ui-slice.ts` (can be integrated)
- `src/shared/types/api.types.ts` (UserPreferences type already defined)

## Support

For issues or questions:
1. Check the module README: `src/modules/settings/README.md`
2. Review this implementation guide
3. Check console logs for detailed error messages
4. Verify database migrations are applied
