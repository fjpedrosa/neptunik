/**
 * Preferences API Route (BFF - Backend for Frontend)
 * Acts as a proxy to the backend API with Prisma
 * Handles GET and PUT requests for user preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000/api'

/**
 * GET /api/preferences
 * Retrieve user preferences from backend API
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      )
    }

    // Call backend API with Prisma
    const backendResponse = await fetch(`${BACKEND_API_URL}/users/${user.id}/preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          error: {
            message: errorData.message || 'Failed to fetch preferences from backend',
            code: errorData.code || 'BACKEND_ERROR',
          },
        },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()

    return NextResponse.json({
      success: true,
      data: data.data || data,
      preferences: data.data?.preferences || data.preferences,
    })
  } catch (error) {
    console.error('Error in GET /api/preferences:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/preferences
 * Update user preferences via backend API
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Preferences are required',
            code: 'VALIDATION_ERROR',
            field: 'preferences',
          },
        },
        { status: 400 }
      )
    }

    // Call backend API with Prisma
    const backendResponse = await fetch(`${BACKEND_API_URL}/users/${user.id}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ preferences }),
      signal: AbortSignal.timeout(30000),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          error: {
            message: errorData.message || 'Failed to update preferences on backend',
            code: errorData.code || 'BACKEND_ERROR',
          },
        },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()

    return NextResponse.json({
      success: true,
      data: data.data || data,
      preferences: data.data?.preferences || data.preferences,
    })
  } catch (error) {
    console.error('Error in PUT /api/preferences:', error)

    const statusCode = error instanceof Error && error.message.includes('Invalid') ? 400 : 500

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        },
      },
      { status: statusCode }
    )
  }
}
