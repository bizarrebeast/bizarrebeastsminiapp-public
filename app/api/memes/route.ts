import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch memes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('user_memes')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (featured) {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memes: data });
  } catch (error) {
    console.error('Error fetching memes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create meme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, description, image_url, tags, is_public } = body;

    if (!user_id || !title || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check user's tier and upload limit
    const { data: userData, error: userError } = await supabase
      .from('unified_users')
      .select('empire_tier')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check current meme count
    const { count, error: countError } = await supabase
      .from('user_memes')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id);

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to check upload limit' },
        { status: 500 }
      );
    }

    // Validate upload limit based on tier
    const limits: Record<string, number> = {
      'NORMIE': 0,
      'MISFIT': 3,
      'ODDBALL': 10,
      'WEIRDO': 25,
      'BIZARRE': 999
    };

    const userTier = userData.empire_tier || 'NORMIE';
    const limit = limits[userTier] || 0;

    if ((count || 0) >= limit) {
      return NextResponse.json(
        { error: `Upload limit reached for ${userTier} tier` },
        { status: 403 }
      );
    }

    // Create meme
    const { data, error } = await supabase
      .from('user_memes')
      .insert({
        user_id,
        title,
        description,
        image_url,
        thumbnail_url: image_url, // Could generate a smaller version
        tags: tags || [],
        is_public: is_public !== false
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, meme: data });
  } catch (error) {
    console.error('Error creating meme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete meme
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memeId = searchParams.get('memeId');
    const userId = searchParams.get('userId');

    if (!memeId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: meme, error: fetchError } = await supabase
      .from('user_memes')
      .select('user_id, image_url')
      .eq('id', memeId)
      .single();

    if (fetchError || !meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      );
    }

    if (meme.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete from storage if exists
    if (meme.image_url && meme.image_url.includes('supabase')) {
      const path = meme.image_url.split('/').slice(-2).join('/');
      await supabase.storage.from('memes').remove([path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('user_memes')
      .delete()
      .eq('id', memeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update meme
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { meme_id, user_id, ...updates } = body;

    if (!meme_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: meme, error: fetchError } = await supabase
      .from('user_memes')
      .select('user_id')
      .eq('id', meme_id)
      .single();

    if (fetchError || !meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      );
    }

    if (meme.user_id !== user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update meme
    const { data, error } = await supabase
      .from('user_memes')
      .update(updates)
      .eq('id', meme_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, meme: data });
  } catch (error) {
    console.error('Error updating meme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}