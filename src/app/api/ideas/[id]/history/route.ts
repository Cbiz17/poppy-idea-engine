import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch development history for this idea
    const { data: history, error } = await supabase
      .from('idea_development_history')
      .select('*')
      .eq('idea_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Format the history for display
    const formattedHistory = (history || []).map(entry => ({
      date: new Date(entry.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      summary: entry.change_summary || `${entry.development_type.replace(/_/g, ' ')}`,
      type: entry.development_type,
      previousTitle: entry.previous_title,
      newTitle: entry.new_title,
      conversationLength: entry.conversation_length,
      confidence: entry.ai_confidence_score
    }));

    return NextResponse.json({ history: formattedHistory });

  } catch (error) {
    console.error('Error in history endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
