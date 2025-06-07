import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateIdeaEmbedding } from '@/lib/embeddings';
import type { 
  CreateIdeaInput, 
  DatabaseIdea, 
  DatabaseIdeaWithBranches,
  IdeasListResponse,
  IdeaResponse,
  ErrorResponse 
} from '@/types/api.types';

function validateIdeaInput(input: any): { valid: boolean; error?: string } {
  if (!input.title || typeof input.title !== 'string' || input.title.length > 200) {
    return { valid: false, error: 'Title is required and must be less than 200 characters' };
  }
  if (!input.content || typeof input.content !== 'string' || input.content.length > 50000) {
    return { valid: false, error: 'Content is required and must be less than 50000 characters' };
  }
  if (!input.category || typeof input.category !== 'string') {
    return { valid: false, error: 'Category is required' };
  }
  return { valid: true };
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as CreateIdeaInput;
    
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate input
    const validation = validateIdeaInput(body);
    if (!validation.valid) {
      return NextResponse.json<ErrorResponse>({ error: validation.error! }, { status: 400 });
    }
    
    const {
      title,
      content,
      category,
      conversationId,
      continuationContext,
      branchedFromId,
      branchNote,
      isBranch,
      metadata
    } = body;
    
    // Generate embedding
    const embedding = await generateIdeaEmbedding(title, content);
    
    // Build idea data with proper typing
    const ideaData: Partial<DatabaseIdea> = {
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      embedding,
      development_count: isBranch ? 1 : 0,
      is_public: false,
      is_branch: false,
      archived: false,
      pinned: false,
      development_stage: 'initial'
    };
    
    // Add branching fields if provided
    if (branchedFromId) {
      ideaData.branched_from_id = branchedFromId;
      ideaData.branch_note = branchNote || null;
      ideaData.is_branch = true;
    }
    
    const { data: newIdea, error: createError } = await supabase
      .from('ideas')
      .insert(ideaData)
      .select()
      .single<DatabaseIdea>();
      
    if (createError) {
      console.error('Error creating idea:', createError);
      return NextResponse.json<ErrorResponse>({ 
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
    
    // Track version history for branches
    if (isBranch && branchedFromId) {
      try {
        // Get the parent idea details
        const { data: parentIdea } = await supabase
          .from('ideas')
          .select('title, content, category')
          .eq('id', branchedFromId)
          .single<Pick<DatabaseIdea, 'title' | 'content' | 'category'>>();
          
        if (parentIdea) {
          const previousVersion = {
            title: parentIdea.title,
            content: parentIdea.content,
            category: parentIdea.category,
            timestamp: new Date().toISOString()
          };
          
          const newVersion = {
            title,
            content,
            category,
            timestamp: new Date().toISOString()
          };
          
          await supabase
            .from('idea_development_history')
            .insert({
              idea_id: newIdea.id,
              user_id: user.id,
              conversation_id: conversationId,
              development_type: 'branch',
              previous_version: previousVersion,
              new_version: newVersion,
              change_summary: branchNote || 'Branched from parent idea',
              ai_confidence_score: metadata?.confidence || 1.0,
              version_number: 1,
              development_metadata: {
                branch_from_id: branchedFromId,
                branch_note: branchNote,
                source: 'branch_creation',
                ...(metadata || {})
              }
            });
        }
      } catch (historyError) {
        console.error('Error tracking branch history:', historyError);
        // Non-critical, continue
      }
    }
    
    return NextResponse.json<IdeaResponse>({ idea: newIdea });
    
  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json<ErrorResponse>({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json<ErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Add pagination support
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const offset = (page - 1) * limit;
    
    // Get total count
    const { count } = await supabase
      .from('ideas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    // Get paginated ideas with branch count
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select(`
        *,
        branches:ideas!branched_from_id(id, title)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching ideas:', error);
      return NextResponse.json<ErrorResponse>({ error: 'Failed to fetch ideas' }, { status: 500 });
    }
    
    // Process ideas to include branch count with proper typing
    const processedIdeas: DatabaseIdeaWithBranches[] = (ideas || []).map(idea => ({
      ...idea as DatabaseIdea,
      branches: idea.branches || []
    }));
    
    return NextResponse.json<IdeasListResponse>({ 
      ideas: processedIdeas,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json<ErrorResponse>({ error: 'Internal server error' }, { status: 500 });
  }
}
