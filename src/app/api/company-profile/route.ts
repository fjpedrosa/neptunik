/**
 * Company Profile API Routes
 * Handles user company profile data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/company-profile - Get authenticated user's company profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Return company profile data
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      companyName: profile.company_name,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });

  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/company-profile - Update authenticated user's company profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Validate and sanitize input
    const updateData: {
      full_name?: string;
      company_name?: string;
      avatar_url?: string;
    } = {};

    if (body.fullName !== undefined) {
      updateData.full_name = body.fullName;
    }

    if (body.companyName !== undefined) {
      updateData.company_name = body.companyName;
    }

    if (body.avatarUrl !== undefined) {
      updateData.avatar_url = body.avatarUrl;
    }

    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Return updated profile
    return NextResponse.json({
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.full_name,
      companyName: updatedProfile.company_name,
      avatarUrl: updatedProfile.avatar_url,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    });

  } catch (error) {
    console.error('Error updating company profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/company-profile - Partially update authenticated user's company profile
 */
export async function PATCH(request: NextRequest) {
  // Use the same logic as PUT for now
  return PUT(request);
}
