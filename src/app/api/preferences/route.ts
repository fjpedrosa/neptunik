/**
 * Preferences API Route
 * Handles GET and PUT requests for user preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  GetPreferencesUseCase,
  UpdatePreferencesUseCase,
  SupabasePreferencesRepository,
  LocalStoragePreferencesRepository,
} from '@/modules/settings'

/**
 * GET /api/preferences
 * Retrieve user preferences
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

    // Create repository and use case
    const repository = new SupabasePreferencesRepository(supabase)
    const useCase = new GetPreferencesUseCase(repository)

    // Execute use case
    const result = await useCase.execute({ userId: user.id })

    return NextResponse.json({
      success: true,
      data: result,
      preferences: result.preferences,
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
 * Update user preferences
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

    // Create repository and use case
    const repository = new SupabasePreferencesRepository(supabase)
    const useCase = new UpdatePreferencesUseCase(repository)

    // Execute use case
    const result = await useCase.execute({
      userId: user.id,
      preferences,
    })

    return NextResponse.json({
      success: true,
      data: result,
      preferences: result.preferences,
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
