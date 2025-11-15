import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';

/**
 * Realtime Events API Route
 * GET /api/realtime/events
 *
 * Server-Sent Events (SSE) endpoint for real-time updates
 * This is a compatibility endpoint - Supabase Realtime is the recommended approach
 *
 * Note: The project primarily uses Supabase Realtime WebSocket connections.
 * This endpoint exists for backward compatibility or specific use cases.
 */
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
        // Create Supabase client
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
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

        // Create a TransformStream for SSE
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Set up SSE headers
        const headers = new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable buffering for nginx
        });

        // Send initial connection event
        const sendEvent = async (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          try {
            await writer.write(encoder.encode(message));
          } catch (error) {
            console.error('Error writing to SSE stream:', error);
          }
        };

        // Start the SSE stream in the background
        (async () => {
          try {
            // Send connected event
            await sendEvent('connected', {
              message: 'Connected to realtime events',
              timestamp: new Date().toISOString(),
              userId: user.id,
            });

            Sentry.addBreadcrumb({
              category: 'realtime',
              message: 'SSE connection established',
              level: 'info',
              data: {
                userId: user.id,
              },
            });

            // Send heartbeat every 30 seconds to keep connection alive
            const heartbeatInterval = setInterval(async () => {
              try {
                await sendEvent('heartbeat', {
                  timestamp: new Date().toISOString(),
                });
              } catch (error) {
                clearInterval(heartbeatInterval);
              }
            }, 30000);

            // In a real implementation, you would:
            // 1. Subscribe to Supabase Realtime channels
            // 2. Forward events to this SSE stream
            // 3. Handle user-specific events
            //
            // Example:
            // const channel = supabase
            //   .channel(`user:${user.id}`)
            //   .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            //     sendEvent('database_change', payload);
            //   })
            //   .subscribe();

            // Send informational message
            await sendEvent('info', {
              message: 'For better real-time performance, use Supabase Realtime WebSocket connections',
              recommendation: 'This SSE endpoint is for compatibility only',
              timestamp: new Date().toISOString(),
            });

            // Handle client disconnect
            request.signal.addEventListener('abort', () => {
              clearInterval(heartbeatInterval);
              writer.close();

              Sentry.addBreadcrumb({
                category: 'realtime',
                message: 'SSE connection closed',
                level: 'info',
                data: {
                  userId: user.id,
                },
              });
            });
          } catch (error) {
            Sentry.captureException(error, {
              tags: {
                api: 'realtime',
                type: 'sse-stream-error',
              },
            });

            await sendEvent('error', {
              message: 'Stream error occurred',
              timestamp: new Date().toISOString(),
            });

            writer.close();
          }
        })();

        span.setStatus({ code: 1, message: 'ok' });

        // Return the SSE stream
        return new Response(stream.readable, {
          headers,
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
