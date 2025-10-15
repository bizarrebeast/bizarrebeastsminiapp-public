import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, restoreRituals, removeRituals } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const normalizedWallet = walletAddress.toLowerCase();

    // Get today's date range
    const today = new Date();
    const date = today.toISOString().split('T')[0];
    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;

    // 1. Find and remove duplicate featured ritual entries (keeping the oldest one)
    const { data: featuredDupes, error: fetchError } = await supabase
      .from('ritual_completions')
      .select('id, created_at')
      .eq('wallet_address', normalizedWallet)
      .eq('ritual_id', 0)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching duplicates:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let removedDuplicates = 0;
    if (featuredDupes && featuredDupes.length > 1) {
      // Keep the first (oldest) entry, delete the rest
      const idsToDelete = featuredDupes.slice(1).map(d => d.id);
      
      const { error: deleteError } = await supabase
        .from('ritual_completions')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error removing duplicates:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      removedDuplicates = idsToDelete.length;
      console.log(`Removed ${removedDuplicates} duplicate featured ritual entries`);
    }

    // 2. Ensure ritual 1 is marked as completed for today
    const { data: ritual1Check } = await supabase
      .from('ritual_completions')
      .select('id')
      .eq('wallet_address', normalizedWallet)
      .eq('ritual_id', 1)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .maybeSingle();

    let addedRitual1 = false;
    if (!ritual1Check) {
      // Add ritual 1 completion
      const { data: newCompletion, error: insertError } = await supabase
        .from('ritual_completions')
        .insert({
          wallet_address: normalizedWallet,
          ritual_id: 1,
          ritual_title: 'Ritual 1',
          completed: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding ritual 1:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      addedRitual1 = true;
      console.log('Added ritual 1 completion');
    }

    // 3. Remove specific rituals if specified
    let removedCount = 0;
    if (removeRituals && removeRituals.length > 0) {
      const { error: deleteError } = await supabase
        .from('ritual_completions')
        .delete()
        .eq('wallet_address', normalizedWallet)
        .in('ritual_id', removeRituals)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (!deleteError) {
        removedCount = removeRituals.length;
        console.log(`Removed rituals: ${removeRituals.join(', ')}`);
      } else {
        console.error('Error removing rituals:', deleteError);
      }
    }

    // 4. Restore any missing rituals if specified
    let restoredCount = 0;
    if (restoreRituals && restoreRituals.length > 0) {
      for (const ritualId of restoreRituals) {
        // Check if this ritual is already completed today
        const { data: existingCompletion } = await supabase
          .from('ritual_completions')
          .select('id')
          .eq('wallet_address', normalizedWallet)
          .eq('ritual_id', ritualId)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .maybeSingle();

        if (!existingCompletion) {
          // Add the completion
          const { error: insertError } = await supabase
            .from('ritual_completions')
            .insert({
              wallet_address: normalizedWallet,
              ritual_id: ritualId,
              ritual_title: ritualId === 0 ? 'Featured Ritual' : `Ritual ${ritualId}`,
              completed: true
            });

          if (!insertError) {
            restoredCount++;
            console.log(`Restored ritual ${ritualId}`);
          } else {
            console.error(`Error restoring ritual ${ritualId}:`, insertError);
          }
        }
      }
    }

    // 5. Get updated completion count for verification
    const { data: allCompletions, error: countError } = await supabase
      .from('ritual_completions')
      .select('ritual_id')
      .eq('wallet_address', normalizedWallet)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (countError) {
      console.error('Error fetching updated completions:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const uniqueRituals = new Set(allCompletions?.map(c => c.ritual_id) || []);

    return NextResponse.json({
      success: true,
      removedDuplicates,
      addedRitual1,
      restoredCount,
      totalCompletions: uniqueRituals.size,
      completedRituals: Array.from(uniqueRituals).sort((a, b) => a - b)
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}