import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminAccess } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate admin access
    if (!validateAdminAccess(body.created_by)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Validate dates
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.end_date);

      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Validate voting dates if voting is enabled
    if (body.voting_enabled && body.voting_start_date && body.voting_end_date) {
      const votingStart = new Date(body.voting_start_date);
      const votingEnd = new Date(body.voting_end_date);
      const startDate = body.start_date ? new Date(body.start_date) : null;
      const endDate = body.end_date ? new Date(body.end_date) : null;

      if (votingEnd <= votingStart) {
        return NextResponse.json(
          { error: 'Voting end date must be after voting start date' },
          { status: 400 }
        );
      }

      // Allow voting period to equal or be within contest dates
      if (startDate && endDate) {
        // Convert to timestamps for accurate comparison
        const contestStartMs = startDate.getTime();
        const contestEndMs = endDate.getTime();
        const votingStartMs = votingStart.getTime();
        const votingEndMs = votingEnd.getTime();

        if (votingStartMs < contestStartMs || votingEndMs > contestEndMs) {
          return NextResponse.json(
            {
              error: 'Voting period must be within contest dates',
              debug: {
                contestStart: startDate.toISOString(),
                contestEnd: endDate.toISOString(),
                votingStart: votingStart.toISOString(),
                votingEnd: votingEnd.toISOString()
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Prepare contest data
    const contestData = {
      name: body.name,
      type: body.type,
      description: body.description || null,
      game_name: body.game_name || null,
      start_date: body.start_date || new Date().toISOString(),
      end_date: body.end_date,
      min_bb_required: body.min_bb_required || 0,
      max_bb_required: body.max_bb_required || null,
      prize_amount: body.prize_amount || null,
      prize_type: body.prize_type || 'tokens',
      nft_contract_address: body.nft_contract_address || null,
      status: body.status || 'active',
      rules: body.rules || null,
      max_entries_per_wallet: body.max_entries_per_wallet || 1,
      is_recurring: body.is_recurring || false,
      recurrence_interval: body.recurrence_interval || null,
      is_test: body.is_test || false,
      banner_image_url: body.banner_image_url || null,
      // CTA fields
      cta_url: body.cta_url || null,
      cta_button_text: body.cta_button_text || null,
      cta_type: body.cta_type || 'internal',
      cta_new_tab: body.cta_new_tab || false,
      track_cta_clicks: body.track_cta_clicks !== false, // Default to true
      // Voting fields
      voting_enabled: body.voting_enabled || false,
      voting_start_date: body.voting_start_date || null,
      voting_end_date: body.voting_end_date || null,
      voting_type: body.voting_type || 'single',
      min_votes_required: body.min_votes_required || 1,
      // Gallery fields
      gallery_enabled: body.gallery_enabled || false,
      display_votes: body.display_votes !== false, // Default to true
      gallery_view_type: body.gallery_view_type || 'grid',
      created_by: body.created_by.toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert contest into database
    const { data: contest, error } = await supabaseAdmin
      .from('contests')
      .insert(contestData)
      .select()
      .single();

    if (error) {
      console.error('Error creating contest:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create contest', 
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('Contest created successfully:', contest.id, contest.name);

    return NextResponse.json({
      success: true,
      contest,
      message: `Contest "${contest.name}" created successfully!`
    });

  } catch (error) {
    console.error('Create contest error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}