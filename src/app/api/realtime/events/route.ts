/**
 * Realtime Events SSE API Route
 *
 * Server-Sent Events (SSE) endpoint for real-time dashboard updates.
 * Streams events for leads, analytics, bot configurations, and system changes.
 */

import { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { serverAuthHelpers } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Keep connections alive for up to 5 minutes
const KEEP_ALIVE_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 300000; // 5 minutes

export async function GET(request: NextRequest) {
  // Create Supabase client
  const supabase = await createClient();

  // Check authentication
  const user = await serverAuthHelpers.getUser(supabase);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Set up SSE stream
  const encoder = new TextEncoder();
  let keepAliveTimer: NodeJS.Timeout | null = null;
  let connectionTimer: NodeJS.Timeout | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to send SSE message
      const sendMessage = (event: string, data: any) => {
        if (isClosed) return;

        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      };

      // Send initial connection message
      sendMessage('connected', {
        timestamp: new Date().toISOString(),
        userId: user.id,
      });

      // Set up keep-alive ping
      keepAliveTimer = setInterval(() => {
        sendMessage('ping', {
          timestamp: new Date().toISOString(),
        });
      }, KEEP_ALIVE_INTERVAL);

      // Set up connection timeout
      connectionTimer = setTimeout(() => {
        isClosed = true;
        sendMessage('timeout', {
          message: 'Connection timeout',
          timestamp: new Date().toISOString(),
        });

        // Clean up
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        controller.close();
      }, CONNECTION_TIMEOUT);

      // Subscribe to Supabase real-time changes
      try {
        // Subscribe to leads changes
        const leadsChannel = supabase
          .channel('dashboard-leads')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'leads',
            },
            (payload) => {
              sendMessage('lead_change', {
                type: payload.eventType,
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
              });
            }
          )
          .subscribe();

        // Subscribe to analytics events
        const analyticsChannel = supabase
          .channel('dashboard-analytics')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'analytics_events',
            },
            (payload) => {
              sendMessage('analytics_event', {
                data: payload.new,
                timestamp: new Date().toISOString(),
              });
            }
          )
          .subscribe();

        // Subscribe to bot configurations
        const botConfigChannel = supabase
          .channel('dashboard-bot-config')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bot_configurations',
            },
            (payload) => {
              sendMessage('bot_config_change', {
                type: payload.eventType,
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
              });
            }
          )
          .subscribe();

        // Subscribe to WhatsApp integrations
        const whatsappChannel = supabase
          .channel('dashboard-whatsapp')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'whatsapp_integrations',
            },
            (payload) => {
              sendMessage('whatsapp_change', {
                type: payload.eventType,
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
              });
            }
          )
          .subscribe();

        // Clean up on connection close
        request.signal.addEventListener('abort', () => {
          isClosed = true;

          // Unsubscribe from all channels
          supabase.removeChannel(leadsChannel);
          supabase.removeChannel(analyticsChannel);
          supabase.removeChannel(botConfigChannel);
          supabase.removeChannel(whatsappChannel);

          // Clear timers
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          if (connectionTimer) clearTimeout(connectionTimer);

          controller.close();
        });
      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
        sendMessage('error', {
          message: 'Failed to establish realtime connection',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });

        // Clean up
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        if (connectionTimer) clearTimeout(connectionTimer);
        controller.close();
      }
    },

    cancel() {
      isClosed = true;
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (connectionTimer) clearTimeout(connectionTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
