import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { visibility } = await req.json();
    const supabase = await createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate visibility value
    if (!['private', 'public', 'shared'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }

    // Check if the idea exists and belongs to the user
    const { data: existingIdea, error: fetchError } = await supabase
      .from('ideas')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existingIdea.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the visibility
    const { data: updatedIdea, error: updateError } = await supabase
      .from('ideas')
      .update({ 
        visibility,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating idea visibility:', updateError);
      return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
    }

    // If making public, ensure discovery stats exist
    if (visibility === 'public') {
      await supabase
        .from('idea_discovery_stats')
        .upsert({ 
          idea_id: id,
          view_count: 0,
          share_count: 0,
          remix_count: 0,
          comment_count: 0,
          like_count: 0
        }, {
          onConflict: 'idea_id'
        });
    }

    return NextResponse.json({ idea: updatedIdea });

  } catch (error) {
    console.error('Error in visibility update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}