import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Vercel Cron Job: Process recurring contests
 *
 * This endpoint runs daily to check for recurring contests that need new instances created.
 * It looks for contests with `is_recurring: true` that have ended, and creates new instances
 * based on their recurrence_interval (daily, weekly, monthly).
 *
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting recurring contests check...');
    const now = new Date();

    // Find all recurring contests that have ended
    const { data: recurringContests, error: fetchError } = await supabaseAdmin
      .from('contests')
      .select('*')
      .eq('is_recurring', true)
      .eq('status', 'ended')
      .not('recurrence_interval', 'is', null);

    if (fetchError) {
      console.error('Error fetching recurring contests:', fetchError);
      throw fetchError;
    }

    if (!recurringContests || recurringContests.length === 0) {
      console.log('✅ No recurring contests need processing');
      return NextResponse.json({
        success: true,
        message: 'No recurring contests to process',
        processed: 0
      });
    }

    console.log(`📋 Found ${recurringContests.length} recurring contest(s) to check`);

    const processed: string[] = [];
    const skipped: string[] = [];

    for (const contest of recurringContests) {
      try {
        // Check if contest has been ended recently (to avoid creating multiple instances)
        const endDate = new Date(contest.end_date);
        const timeSinceEnd = now.getTime() - endDate.getTime();
        const hoursSinceEnd = timeSinceEnd / (1000 * 60 * 60);

        // Check if we already created a new instance recently (within 1 day)
        const { data: recentInstances } = await supabaseAdmin
          .from('contests')
          .select('id, created_at')
          .eq('name', contest.name)
          .eq('status', 'active')
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (recentInstances && recentInstances.length > 0) {
          console.log(`⏭️  Skipping "${contest.name}" - active instance already exists`);
          skipped.push(contest.name);
          continue;
        }

        // Calculate new dates based on recurrence interval
        let newStartDate: Date;
        let newEndDate: Date;

        switch (contest.recurrence_interval) {
          case 'daily':
            // Start tomorrow at the same time as original start
            newStartDate = new Date(endDate);
            newStartDate.setDate(newStartDate.getDate() + 1);
            newEndDate = new Date(newStartDate);
            newEndDate.setDate(newEndDate.getDate() + 1);
            break;

          case 'weekly':
            // Start next week
            newStartDate = new Date(endDate);
            newStartDate.setDate(newStartDate.getDate() + 7);
            newEndDate = new Date(newStartDate);
            newEndDate.setDate(newEndDate.getDate() + 7);
            break;

          case 'monthly':
            // Start next month
            newStartDate = new Date(endDate);
            newStartDate.setMonth(newStartDate.getMonth() + 1);
            newEndDate = new Date(newStartDate);
            newEndDate.setMonth(newEndDate.getMonth() + 1);
            break;

          default:
            console.log(`⚠️  Unknown recurrence interval: ${contest.recurrence_interval}`);
            skipped.push(contest.name);
            continue;
        }

        // Create new contest instance
        const newContest = {
          name: contest.name,
          type: contest.type,
          description: contest.description,
          game_name: contest.game_name,
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString(),
          min_bb_required: contest.min_bb_required,
          max_bb_required: contest.max_bb_required,
          prize_amount: contest.prize_amount,
          prize_type: contest.prize_type,
          nft_contract_address: contest.nft_contract_address,
          status: 'active',
          rules: contest.rules,
          max_entries_per_wallet: contest.max_entries_per_wallet,
          is_recurring: true,
          recurrence_interval: contest.recurrence_interval,
          is_test: contest.is_test,
          banner_image_url: contest.banner_image_url,
          voting_enabled: contest.voting_enabled,
          voting_start_date: contest.voting_start_date ? newStartDate.toISOString() : null,
          voting_end_date: contest.voting_end_date ? newEndDate.toISOString() : null,
          voting_type: contest.voting_type,
          min_votes_required: contest.min_votes_required,
          cta_url: contest.cta_url,
          cta_button_text: contest.cta_button_text,
          cta_type: contest.cta_type,
          cta_new_tab: contest.cta_new_tab,
          track_cta_clicks: contest.track_cta_clicks,
          gallery_enabled: contest.gallery_enabled,
          display_votes: contest.display_votes,
          gallery_view_type: contest.gallery_view_type,
          created_by: contest.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: created, error: createError } = await supabaseAdmin
          .from('contests')
          .insert(newContest)
          .select()
          .single();

        if (createError) {
          console.error(`❌ Failed to create new instance of "${contest.name}":`, createError);
          throw createError;
        }

        console.log(`✅ Created new instance of "${contest.name}" (${contest.recurrence_interval})`);
        console.log(`   Start: ${newStartDate.toISOString()}`);
        console.log(`   End: ${newEndDate.toISOString()}`);

        processed.push(contest.name);

      } catch (error) {
        console.error(`Error processing contest "${contest.name}":`, error);
        // Continue with other contests even if one fails
      }
    }

    const response = {
      success: true,
      message: `Processed ${processed.length} recurring contest(s)`,
      processed: processed.length,
      skipped: skipped.length,
      details: {
        processed,
        skipped
      }
    };

    console.log('🎉 Recurring contests processing complete:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process recurring contests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
