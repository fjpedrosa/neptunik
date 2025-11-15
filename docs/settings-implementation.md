# Settings & Preferences Implementation Guide

## Overview

This document describes the implementation of the Settings and Preferences feature for Neptunik using Clean Architecture with a backend API (Prisma).

## Architecture

### High-Level Flow

```
Frontend (Next.js) → Next.js API Routes (BFF) → Backend API (Prisma) → Database
```

1. **Frontend**: React components and hooks
2. **BFF (Backend for Frontend)**: Next.js API routes act as a proxy
3. **Backend API**: Separate service with Prisma ORM handling database operations
4. **Database**: PostgreSQL (or your preferred database)

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
  - `HttpPreferencesRepository` - HTTP client to call backend API
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

### 3. API Endpoints (BFF Layer)

Next.js API routes that proxy requests to the backend:

- **GET `/api/preferences`** - Retrieve user preferences
  - Authenticates user
  - Calls backend `GET /users/:userId/preferences`
  - Returns preferences to frontend

- **PUT `/api/preferences`** - Update user preferences
  - Validates authentication
  - Proxies request to backend `PUT /users/:userId/preferences`
  - Returns updated preferences

- **GET `/api/realtime/events`** - Server-Sent Events for real-time updates

## Backend API Requirements

The backend API (separate service) must implement these endpoints:

### GET /users/:userId/preferences

Retrieve user preferences from database using Prisma.

**Request:**
```http
GET /users/{userId}/preferences HTTP/1.1
Authorization: Bearer {token}
```

**Response:**
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

### PUT /users/:userId/preferences

Update user preferences in database using Prisma.

**Request:**
```http
PUT /users/{userId}/preferences HTTP/1.1
Content-Type: application/json
Authorization: Bearer {token}

{
  "preferences": {
    "theme": "dark",
    "language": "es"
  }
}
```

**Response:**
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

### DELETE /users/:userId/preferences

Reset preferences to defaults.

**Request:**
```http
DELETE /users/{userId}/preferences HTTP/1.1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": { /* default preferences */ }
  }
}
```

## Setup Instructions

### 1. Configure Environment Variables

Add to `.env.local`:

```bash
# Backend API URL (Prisma service)
BACKEND_API_URL=http://localhost:4000/api
# Or for production
# BACKEND_API_URL=https://api.neptunik.com/api

# Optional: For client-side
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4000/api
```

### 2. Backend Database Schema (Prisma)

The backend API should have this Prisma schema:

```prisma
model UserPreferences {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")

  // Appearance
  theme     String   @default("system") // 'light', 'dark', 'system'

  // Localization
  language  String   @default("es") // 'en', 'es', 'fr', 'pt', 'de'
  timezone  String   @default("UTC")
  dateFormat String  @default("DD/MM/YYYY") @map("date_format")

  // Notifications
  notificationsEmail    Boolean @default(true) @map("notifications_email")
  notificationsPush     Boolean @default(true) @map("notifications_push")
  notificationsMarketing Boolean @default(false) @map("notifications_marketing")
  notificationsSecurity Boolean @default(true) @map("notifications_security")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("user_preferences")
}
```

### 3. Backend Implementation Example (Prisma)

```typescript
// backend/src/controllers/preferences.controller.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getPreferences(req, res) {
  const { userId } = req.params

  try {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    // If no preferences exist, return defaults
    if (!preferences) {
      preferences = {
        theme: 'system',
        language: 'es',
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY',
        notificationsEmail: true,
        notificationsPush: true,
        notificationsMarketing: false,
        notificationsSecurity: true
      }
    }

    // Transform to API format
    const apiPreferences = {
      theme: preferences.theme,
      language: preferences.language,
      timezone: preferences.timezone,
      dateFormat: preferences.dateFormat,
      notifications: {
        email: preferences.notificationsEmail,
        push: preferences.notificationsPush,
        marketing: preferences.notificationsMarketing,
        security: preferences.notificationsSecurity
      }
    }

    res.json({
      success: true,
      data: { preferences: apiPreferences }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
}

export async function updatePreferences(req, res) {
  const { userId } = req.params
  const { preferences } = req.body

  try {
    // Transform from API format to database format
    const dbData = {
      userId,
      theme: preferences.theme,
      language: preferences.language,
      timezone: preferences.timezone,
      dateFormat: preferences.dateFormat,
      notificationsEmail: preferences.notifications?.email,
      notificationsPush: preferences.notifications?.push,
      notificationsMarketing: preferences.notifications?.marketing,
      notificationsSecurity: preferences.notifications?.security
    }

    const updated = await prisma.userPreferences.upsert({
      where: { userId },
      update: dbData,
      create: dbData
    })

    // Transform back to API format
    const apiPreferences = {
      theme: updated.theme,
      language: updated.language,
      timezone: updated.timezone,
      dateFormat: updated.dateFormat,
      notifications: {
        email: updated.notificationsEmail,
        push: updated.notificationsPush,
        marketing: updated.notificationsMarketing,
        security: updated.notificationsSecurity
      }
    }

    res.json({
      success: true,
      data: { preferences: apiPreferences }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
}
```

## Files Created

- `src/modules/settings/` (entire module with HTTP adapter)
- `src/app/settings/page.tsx`
- `src/app/settings/layout.tsx`
- `src/app/api/preferences/route.ts` (BFF layer)
- `src/app/api/realtime/events/route.ts`
- `docs/settings-implementation.md`

## Summary

- ✅ Clean Architecture with HTTP backend
- ✅ Next.js API routes as BFF layer
- ✅ Backend API with Prisma (to be implemented separately)
- ✅ Type-safe preferences management
- ✅ Fallback to LocalStorage
- ✅ Responsive UI with Tailwind
- ✅ Full documentation
