import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Realtime Events API Route (Proxy to Backend)
 * GET /api/realtime/events
 *
 * Server-Sent Events (SSE) endpoint for real-time updates
 * This endpoint proxies SSE connections to the backend API
 *
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

export async function GET(request: NextRequest) {
  return await Sentry.startSpan(
    {
      name: 'api.realtime.events',
      op: 'http.server',
      attributes: {
        'http.method': 'GET',
        'http.route': '/api/realtime/events',
      },
    },
    async (span) => {
      try {
        // Get auth token
        const token = getAuthToken(request);

        if (!token) {
          span.setStatus({ code: 2, message: 'unauthorized' });

          // For SSE, we can't return JSON, so return a text response
          return new Response(
            'event: error\ndata: {"error": "Unauthorized", "message": "Authentication required"}\n\n',
            {
              status: 401,
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            }
          );
        }

        // Proxy SSE connection to backend
        const backendResponse = await fetch(`${BACKEND_URL}/api/v1/realtime/events`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
          },
          // @ts-ignore - signal is supported but types may not reflect it
          signal: request.signal,
        });

        if (!backendResponse.ok) {
          span.setStatus({ code: 2, message: 'backend_error' });

          return new Response(
            `event: error\ndata: {"error": "Backend Error", "message": "Backend returned ${backendResponse.status}"}\n\n`,
            {
              status: backendResponse.status,
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            }
          );
        }

        span.setStatus({ code: 1, message: 'ok' });

        Sentry.addBreadcrumb({
          category: 'realtime',
          message: 'SSE connection proxied to backend',
          level: 'info',
        });

        // Forward the SSE stream from backend
        return new Response(backendResponse.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        });
      } catch (error) {
        // Capture exception to Sentry
        Sentry.captureException(error, {
          tags: {
            api: 'realtime',
            type: 'sse-connection-error',
          },
        });

        span.setStatus({ code: 2, message: 'error' });

        return new Response(
          `event: error\ndata: ${JSON.stringify({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development'
              ? (error as Error).message
              : 'Failed to establish realtime connection',
          })}\n\n`,
          {
            status: 500,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          }
        );
      }
    }
  );
}

/**
 * OPTIONS endpoint for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
