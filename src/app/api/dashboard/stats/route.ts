/**
 * Dashboard Stats API Route
 *
 * Provides aggregated statistics for the dashboard including
 * leads, analytics events, and system metrics.
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { serverAuthHelpers } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface DashboardStats {
  leads: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  analytics: {
    totalEvents: number;
    uniqueUsers: number;
    uniqueSessions: number;
  };
  conversions: {
    totalLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
  };
  activity: {
    lastHour: number;
    last24Hours: number;
    last7Days: number;
  };
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

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch leads statistics
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    const { count: todayLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    const { count: weekLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());

    const { count: monthLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    const { count: qualifiedLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'qualified');

    // Fetch analytics statistics
    const { data: analyticsEvents } = await supabase
      .from('analytics_events')
      .select('user_id, session_id')
      .gte('created_at', last7Days.toISOString());

    const uniqueUsers = new Set(
      (analyticsEvents || [])
        .filter(e => e.user_id)
        .map(e => e.user_id)
    ).size;

    const uniqueSessions = new Set(
      (analyticsEvents || [])
        .filter(e => e.session_id)
        .map(e => e.session_id)
    ).size;

    // Fetch activity statistics
    const { count: lastHourActivity } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastHour.toISOString());

    const { count: last24HoursActivity } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24Hours.toISOString());

    const { count: last7DaysActivity } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last7Days.toISOString());

    // Calculate conversion rate
    const conversionRate = totalLeads && qualifiedLeads
      ? Math.round((qualifiedLeads / totalLeads) * 100 * 100) / 100
      : 0;

    const stats: DashboardStats = {
      leads: {
        total: totalLeads || 0,
        today: todayLeads || 0,
        thisWeek: weekLeads || 0,
        thisMonth: monthLeads || 0,
      },
      analytics: {
        totalEvents: (analyticsEvents || []).length,
        uniqueUsers,
        uniqueSessions,
      },
      conversions: {
        totalLeads: totalLeads || 0,
        qualifiedLeads: qualifiedLeads || 0,
        conversionRate,
      },
      activity: {
        lastHour: lastHourActivity || 0,
        last24Hours: last24HoursActivity || 0,
        last7Days: last7DaysActivity || 0,
      },
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
