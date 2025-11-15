import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';

/**
 * User Profile API Route
 * GET /api/profile - Get current user's profile
 * PUT /api/profile - Update current user's profile
 *
 * Requires authentication via Supabase session
 */

/**
 * GET /api/profile
 * Fetch the current authenticated user's profile
 */
export async function GET(request: NextRequest) {
  return await Sentry.startSpan(
    {
      name: 'api.profile.get',
      op: 'http.server',
      attributes: {
        'http.method': 'GET',
        'http.route': '/api/profile',
      },
    },
    async (span) => {
      try {
        // Create Supabase client
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          span.setStatus({ code: 2, message: 'unauthorized' });
          return NextResponse.json(
            {
              success: false,
              error: 'Unauthorized',
              message: 'You must be logged in to access this resource',
            },
            { status: 401 }
          );
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          // If profile doesn't exist, return minimal user info from auth
          if (profileError.code === 'PGRST116') {
            return NextResponse.json(
              {
                success: true,
                data: {
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || '',
                  phone_number: user.phone || null,
                  company_name: null,
                  timezone: 'UTC',
                  language: 'es',
                  avatar_url: user.user_metadata?.avatar_url || null,
                  email_verified: user.email_confirmed_at ? true : false,
                  two_factor_enabled: false,
                  onboarding_completed: false,
                  marketing_emails: false,
                  created_at: user.created_at,
                  updated_at: user.updated_at || user.created_at,
                },
              },
              { status: 200 }
            );
          }

          throw profileError;
        }

        span.setStatus({ code: 1, message: 'ok' });

        return NextResponse.json(
          {
            success: true,
            data: {
              id: profile.id,
              user_id: profile.user_id,
              email: user.email,
              full_name: profile.full_name,
              phone_number: profile.phone_number,
              company_name: profile.company_name,
              timezone: profile.timezone || 'UTC',
              language: profile.language || 'es',
              avatar_url: profile.avatar_url,
              email_verified: user.email_confirmed_at ? true : false,
              two_factor_enabled: profile.two_factor_enabled || false,
              onboarding_completed: profile.onboarding_completed || false,
              marketing_emails: profile.marketing_emails || false,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            },
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'private, max-age=600', // Cache for 10 minutes
            },
          }
        );
      } catch (error) {
        // Capture exception to Sentry
        Sentry.captureException(error, {
          tags: {
            api: 'profile',
            type: 'get-profile-error',
          },
        });

        span.setStatus({ code: 2, message: 'error' });

        return NextResponse.json(
          {
            success: false,
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development'
              ? (error as Error).message
              : 'Failed to fetch profile',
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * PUT /api/profile
 * Update the current authenticated user's profile
 */
export async function PUT(request: NextRequest) {
  return await Sentry.startSpan(
    {
      name: 'api.profile.update',
      op: 'http.server',
      attributes: {
        'http.method': 'PUT',
        'http.route': '/api/profile',
      },
    },
    async (span) => {
      try {
        // Create Supabase client
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          span.setStatus({ code: 2, message: 'unauthorized' });
          return NextResponse.json(
            {
              success: false,
              error: 'Unauthorized',
              message: 'You must be logged in to access this resource',
            },
            { status: 401 }
          );
        }

        // Parse request body
        const body = await request.json();

        // Validate and sanitize input
        const allowedFields = [
          'full_name',
          'phone_number',
          'company_name',
          'timezone',
          'language',
          'marketing_emails',
        ];

        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        // Only include allowed fields
        for (const field of allowedFields) {
          if (field in body) {
            updateData[field] = body[field];
          }
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 1) {
          return NextResponse.json(
            {
              success: false,
              error: 'Bad Request',
              message: 'No valid fields to update',
            },
            { status: 400 }
          );
        }

        // Update or insert profile
        const { data: profile, error: updateError } = await supabase
          .from('user_profiles')
          .upsert(
            {
              user_id: user.id,
              ...updateData,
            },
            {
              onConflict: 'user_id',
            }
          )
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        span.setStatus({ code: 1, message: 'ok' });

        Sentry.addBreadcrumb({
          category: 'api',
          message: 'Profile updated successfully',
          level: 'info',
          data: {
            userId: user.id,
            updatedFields: Object.keys(updateData).filter(k => k !== 'updated_at'),
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: {
              id: profile.id,
              user_id: profile.user_id,
              email: user.email,
              full_name: profile.full_name,
              phone_number: profile.phone_number,
              company_name: profile.company_name,
              timezone: profile.timezone || 'UTC',
              language: profile.language || 'es',
              avatar_url: profile.avatar_url,
              email_verified: user.email_confirmed_at ? true : false,
              two_factor_enabled: profile.two_factor_enabled || false,
              onboarding_completed: profile.onboarding_completed || false,
              marketing_emails: profile.marketing_emails || false,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            },
            message: 'Profile updated successfully',
          },
          { status: 200 }
        );
      } catch (error) {
        // Capture exception to Sentry
        Sentry.captureException(error, {
          tags: {
            api: 'profile',
            type: 'update-profile-error',
          },
        });

        span.setStatus({ code: 2, message: 'error' });

        return NextResponse.json(
          {
            success: false,
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development'
              ? (error as Error).message
              : 'Failed to update profile',
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * PATCH /api/profile
 * Partial update of the current authenticated user's profile
 * (Alias for PUT endpoint)
 */
export async function PATCH(request: NextRequest) {
  return PUT(request);
}
