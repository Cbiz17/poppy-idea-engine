import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const { 
      title, 
      content, 
      category, 
      conversationId, 
      continuationContext, 
      originalIdeaId,
      branchedFromId,
      branchNote,
      isBranch 
    } = await req.json();
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate embedding
    let embedding = null;
    try {
      const embedResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });

      if (embedResponse.ok) {
        const embedData = await embedResponse.json();
        embedding = embedData.embedding;
      }
    } catch (embedError) {
      console.error('Error generating embedding:', embedError);
    }

    // Create new idea
    const ideaData = {
      user_id: user.id,
      title,
      content,
      category,
      embedding,
      development_count: isBranch ? 1 : 0,
      ...(branchedFromId && {
        branched_from_id: branchedFromId,
        branch_note: branchNote,
        is_branch: true
      })
    };

    const { data: newIdea, error: createError } = await supabase
      .from('ideas')
      .insert(ideaData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating idea:', createError);
      return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
    }

    // Track in development history as initial creation
    try {
      await supabase
        .from('idea_development_history')
        .insert({
          idea_id: newIdea.id,
          conversation_id: conversationId,
          user_id: user.id,
          previous_title: '',
          new_title: title,
          previous_content: '',
          new_content: content,
          previous_category: '',
          new_category: category,
          development_type: isBranch ? 'branch' : 'initial_creation',
          change_summary: isBranch 
            ? `Branched from parent idea: ${branchNote || 'Exploring new direction'}` 
            : originalIdeaId 
              ? 'Created as variation of existing idea' 
              : 'Initial idea creation',
          ai_confidence_score: 1.0,
          version_number: 1
        });
    } catch (historyError) {
      console.error('Error tracking history:', historyError);
    }

    // If this is a continuation/variation, track the relationship
    if (continuationContext && conversationId) {
      try {
        await supabase
          .from('conversation_continuity')
          .insert({
            user_id: user.id,
            original_conversation_id: conversationId,
            continuation_conversation_id: conversationId,
            idea_id: newIdea.id,
            time_gap_hours: continuationContext.timeSinceLastUpdate || 0,
            continuation_detected_by: continuationContext.detectionMethod || 'user_explicit',
            detection_confidence: continuationContext.confidence || 1.0
          });
      } catch (continuityError) {
        console.error('Error tracking continuity:', continuityError);
      }
    }

    return NextResponse.json({ idea: newIdea });

  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
