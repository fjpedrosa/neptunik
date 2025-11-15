import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * User Profile API Route (Proxy to Backend)
 * GET /api/profile - Get current user's profile
 * PUT /api/profile - Update current user's profile
 *
 * This endpoint acts as a proxy to the backend API
 * Backend URLs:
 * - Production: https://api.neptunik.com
 * - Local: http://localhost:3030
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.neptunik.com'
    : 'http://localhost:3030');

/**
 * Helper to get auth token from request
 */
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check for token in cookies
  const cookieToken = request.cookies.get('auth_token')?.value;
  return cookieToken || null;
}

/**
 * GET /api/profile
 * Fetch the current authenticated user's profile from backend
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
        // Get auth token
        const token = getAuthToken(request);

        if (!token) {
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

        // Call backend API
        const backendResponse = await fetch(`${BACKEND_URL}/api/v1/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Forward backend response status
        if (!backendResponse.ok) {
          const errorData = await backendResponse.json().catch(() => ({
            error: 'Backend Error',
            message: `Backend returned ${backendResponse.status}`,
          }));

          span.setStatus({ code: 2, message: 'backend_error' });

          return NextResponse.json(
            {
              success: false,
              ...errorData,
            },
            { status: backendResponse.status }
          );
        }

        // Forward successful response
        const data = await backendResponse.json();
        span.setStatus({ code: 1, message: 'ok' });

        return NextResponse.json(data, {
          status: 200,
          headers: {
            'Cache-Control': 'private, max-age=600', // Cache for 10 minutes
          },
        });
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
 * Update the current authenticated user's profile (proxy to backend)
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
        // Get auth token
        const token = getAuthToken(request);

        if (!token) {
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

        // Call backend API
        const backendResponse = await fetch(`${BACKEND_URL}/api/v1/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        // Forward backend response status
        if (!backendResponse.ok) {
          const errorData = await backendResponse.json().catch(() => ({
            error: 'Backend Error',
            message: `Backend returned ${backendResponse.status}`,
          }));

          span.setStatus({ code: 2, message: 'backend_error' });

          return NextResponse.json(
            {
              success: false,
              ...errorData,
            },
            { status: backendResponse.status }
          );
        }

        // Forward successful response
        const data = await backendResponse.json();
        span.setStatus({ code: 1, message: 'ok' });

        Sentry.addBreadcrumb({
          category: 'api',
          message: 'Profile updated successfully',
          level: 'info',
        });

        return NextResponse.json(data, { status: 200 });
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
 * (Alias for PUT endpoint, proxies to backend)
 */
export async function PATCH(request: NextRequest) {
  return PUT(request);
}
