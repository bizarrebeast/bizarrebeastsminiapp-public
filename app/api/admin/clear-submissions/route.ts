import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: Request) {
  try {
    // Get admin wallet from headers for authentication
    const adminWallet = request.headers.get('x-admin-wallet');

    if (!adminWallet || adminWallet.toLowerCase() !== process.env.NEXT_PUBLIC_CONTEST_ADMIN_WALLET?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all contest submissions
    const { error } = await supabase
      .from('contest_submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records (id is never this value)

    if (error) {
      console.error('Error clearing submissions:', error);
      return NextResponse.json(
        { error: 'Failed to clear submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All contest submissions have been cleared'
    });

  } catch (error) {
    console.error('Clear submissions error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}