/**
 * Dashboard Recent Changes API Route
 *
 * Provides recent activity and changes across the system including
 * new leads, analytics events, and configuration updates.
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { serverAuthHelpers } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface RecentActivity {
  id: string;
  type: 'lead' | 'event' | 'bot_config' | 'whatsapp_integration';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Check authentication
    const user = await serverAuthHelpers.getUser(supabase);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const recentActivities: RecentActivity[] = [];

    // Fetch recent leads
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('id, name, email, company, status, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 10));

    if (recentLeads) {
      recentActivities.push(
        ...recentLeads.map(lead => ({
          id: `lead-${lead.id}`,
          type: 'lead' as const,
          title: `New lead from ${lead.name || 'Unknown'}`,
          description: lead.company
            ? `${lead.email} from ${lead.company}`
            : lead.email || 'No email provided',
          timestamp: lead.created_at,
          metadata: {
            status: lead.status,
            leadId: lead.id,
          },
        }))
      );
    }

    // Fetch recent analytics events
    const { data: recentEvents } = await supabase
      .from('analytics_events')
      .select('id, event_name, page_url, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 10));

    if (recentEvents) {
      recentActivities.push(
        ...recentEvents.map(event => ({
          id: `event-${event.id}`,
          type: 'event' as const,
          title: `Analytics event: ${event.event_name}`,
          description: event.page_url || 'No page URL',
          timestamp: event.created_at,
          metadata: {
            eventName: event.event_name,
            userId: event.user_id,
          },
        }))
      );
    }

    // Fetch recent bot configurations
    const { data: recentBotConfigs } = await supabase
      .from('bot_configurations')
      .select('id, name, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(Math.min(limit, 5));

    if (recentBotConfigs) {
      recentActivities.push(
        ...recentBotConfigs.map(config => ({
          id: `bot-config-${config.id}`,
          type: 'bot_config' as const,
          title: `Bot configuration updated: ${config.name}`,
          description: `Status: ${config.status}`,
          timestamp: config.updated_at,
          metadata: {
            configId: config.id,
            status: config.status,
          },
        }))
      );
    }

    // Fetch recent WhatsApp integrations
    const { data: recentIntegrations } = await supabase
      .from('whatsapp_integrations')
      .select('id, phone_number_id, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(Math.min(limit, 5));

    if (recentIntegrations) {
      recentActivities.push(
        ...recentIntegrations.map(integration => ({
          id: `whatsapp-${integration.id}`,
          type: 'whatsapp_integration' as const,
          title: `WhatsApp integration updated`,
          description: `Phone: ${integration.phone_number_id || 'Not configured'}`,
          timestamp: integration.updated_at,
          metadata: {
            integrationId: integration.id,
            status: integration.status,
          },
        }))
      );
    }

    // Sort all activities by timestamp and limit
    const sortedActivities = recentActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json(sortedActivities, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching recent dashboard changes:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
