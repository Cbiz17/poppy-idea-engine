import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-ada-002';

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
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate input
    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Generate embedding
    let embedding = null;
    try {
      if (process.env.OPENAI_API_KEY) {
        const inputText = `${title} ${content}`.replace(/\n/g, ' ');
        
        const embeddingResponse = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: inputText,
        });
        
        embedding = embeddingResponse?.data?.[0]?.embedding;
      }
    } catch (embedError) {
      console.error('Error generating embedding:', embedError);
      // Continue without embedding
    }
    
    const ideaData: any = {
      user_id: user.id,
      title,
      content,
      category,
      embedding,
      development_count: isBranch ? 1 : 0
    }
    
    // Add branching fields if provided
    if (branchedFromId) {
      ideaData.branched_from_id = branchedFromId
      ideaData.branch_note = branchNote
      ideaData.is_branch = true
    }
    
    const { data: newIdea, error: createError } = await supabase
      .from('ideas')
      .insert(ideaData)
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating idea:', createError);
      return NextResponse.json({ 
        error: 'Failed to create idea',
        details: createError.message 
      }, { status: 500 });
    }
    
    // If this is a continuation/variation, track the relationship
    if (continuationContext && continuationContext.relatedIdeaId) {
      await supabase.from('conversation_continuity').insert({
        user_id: user.id,
        original_conversation_id: conversationId,
        continuation_conversation_id: conversationId,
        idea_id: newIdea.id,
        time_gap_hours: continuationContext.timeSinceLastUpdate || 0,
        continuation_detected_by: continuationContext.detectionMethod || 'user_explicit',
        detection_confidence: continuationContext.confidence || 1.0
      });
    }
    
    return NextResponse.json({ idea: newIdea });
    
  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get ideas with branch count
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select(`
        *,
        branches:ideas!branched_from_id(id, title)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching ideas:', error);
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
    }
    
    // Process ideas to include branch count
    const processedIdeas = ideas?.map(idea => ({
      ...idea,
      branches: idea.branches || []
    })) || [];
    
    return NextResponse.json({ ideas: processedIdeas });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
