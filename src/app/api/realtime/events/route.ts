/**
 * Realtime Events API Route
 * Server-Sent Events endpoint for real-time updates
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/realtime/events
 * Stream real-time events to the client using Server-Sent Events
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
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString(),
          userId: user.id,
        })}\n\n`
        controller.enqueue(encoder.encode(initialMessage))

        // Keep connection alive with periodic heartbeats
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            })}\n\n`
            controller.enqueue(encoder.encode(heartbeat))
          } catch (error) {
            console.error('Error sending heartbeat:', error)
            clearInterval(heartbeatInterval)
            controller.close()
          }
        }, 30000) // Send heartbeat every 30 seconds

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval)
          controller.close()
        })

        // TODO: Subscribe to Supabase realtime channels
        // const channel = supabase.channel(`user:${user.id}`)
        // channel.on('broadcast', { event: 'preferences_updated' }, (payload) => {
        //   const message = `data: ${JSON.stringify({
        //     type: 'preferences_updated',
        //     data: payload,
        //     timestamp: new Date().toISOString(),
        //   })}\n\n`
        //   controller.enqueue(encoder.encode(message))
        // })
        // await channel.subscribe()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for nginx
      },
    })
  } catch (error) {
    console.error('Error in GET /api/realtime/events:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
