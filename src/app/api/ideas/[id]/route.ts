import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateIdeaEmbedding } from '@/lib/embeddings';

// Input validation
function validateIdeaUpdate(input: any): { valid: boolean; error?: string } {
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = await createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const validation = validateIdeaUpdate(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, content, category, conversationId, developmentType, metadata } = body;

    // Check if the idea exists and belongs to the user
    const { data: existingIdea, error: fetchError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existingIdea.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate new embedding for updated content
    const embedding = await generateIdeaEmbedding(title, content);

    // Update the idea
    interface UpdateData {
      title: string;
      content: string;
      category: string;
      updated_at: string;
      embedding?: any;
    }
    
    const updateData: UpdateData = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      updated_at: new Date().toISOString()
    };

    if (embedding) {
      updateData.embedding = embedding;
    }

    const { data: updatedIdea, error: updateError } = await supabase
      .from('ideas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating idea:', updateError);
      return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
    }

    // Enhanced history tracking with conversation context
    try {
      // Get the latest version number
      const { data: latestHistory } = await supabase
        .from('idea_development_history')
        .select('version_number')
        .eq('idea_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const newVersionNumber = (latestHistory?.version_number || 0) + 1;

      // Use provided development type or determine based on changes
      const finalDevelopmentType = developmentType || determineDevelopmentType(
        existingIdea, 
        { title, content, category }
      );

      // Create the version objects in the correct format
      const previousVersion = {
        title: existingIdea.title,
        content: existingIdea.content,
        category: existingIdea.category,
        timestamp: existingIdea.updated_at
      };

      const newVersion = {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('idea_development_history')
        .insert({
          idea_id: id,
          conversation_id: conversationId || null,
          user_id: user.id,
          previous_version: previousVersion,
          new_version: newVersion,
          development_type: finalDevelopmentType,
          change_summary: generateChangeSummary(existingIdea, { title, content, category }),
          ai_confidence_score: metadata?.confidence || 1.0,
          version_number: newVersionNumber,
          tags: metadata?.tags || [],
          development_metadata: {
            source: conversationId ? 'conversation' : 'manual_edit',
            ...(metadata || {})
          }
        });

      // Update development count
      await supabase
        .from('ideas')
        .update({ 
          development_count: newVersionNumber,
          last_activity: new Date().toISOString()
        })
        .eq('id', id);

      // Return updated idea with development count
      updatedIdea.development_count = newVersionNumber;

    } catch (historyError) {
      console.error('Error tracking history:', historyError);
      // Non-critical, continue
    }

    return NextResponse.json({ idea: updatedIdea });

  } catch (error) {
    console.error('Error in idea update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
interface IdeaData {
  title: string;
  content: string;
  category: string;
}

function determineDevelopmentType(oldIdea: IdeaData, newIdea: IdeaData): string {
  const contentChanged = oldIdea.content !== newIdea.content;
  const titleChanged = oldIdea.title !== newIdea.title;
  const categoryChanged = oldIdea.category !== newIdea.category;
  
  const contentChangeRatio = contentChanged 
    ? Math.abs(oldIdea.content.length - newIdea.content.length) / oldIdea.content.length 
    : 0;
  
  if (contentChangeRatio > 0.5 && titleChanged) {
    return 'major_revision';
  } else if (contentChanged || titleChanged) {
    return 'refinement';
  } else if (categoryChanged) {
    return 'refinement'; // categorization_change isn't in the enum
  } else {
    return 'refinement';
  }
}

function generateChangeSummary(oldIdea: IdeaData, newIdea: IdeaData): string {
  const changes = [];
  
  if (oldIdea.title !== newIdea.title) {
    changes.push('Updated title');
  }
  
  if (oldIdea.content !== newIdea.content) {
    const contentChangeRatio = Math.abs(oldIdea.content.length - newIdea.content.length) / oldIdea.content.length;
    if (contentChangeRatio > 0.5) {
      changes.push('Major content revision');
    } else if (newIdea.content.length > oldIdea.content.length) {
      changes.push('Expanded content');
    } else {
      changes.push('Refined content');
    }
  }
  
  if (oldIdea.category !== newIdea.category) {
    changes.push(`Changed category from ${oldIdea.category} to ${newIdea.category}`);
  }
  
  return changes.length > 0 ? changes.join(', ') : 'Minor updates';
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const validation = validateIdeaUpdate(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, content, category, saveType, originalId } = body;

    // Generate embedding
    const embedding = await generateIdeaEmbedding(title, content);

    // Create new idea
    const { data: newIdea, error: createError } = await supabase
      .from('ideas')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        embedding
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating idea:', createError);
      return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
    }

    // If this is a variation of an existing idea, track it
    if (saveType === 'new' && originalId) {
      try {
        const newVersion = {
          title: title.trim(),
          content: content.trim(),
          category: category.trim(),
          timestamp: new Date().toISOString()
        };

        await supabase
          .from('idea_development_history')
          .insert({
            idea_id: newIdea.id,
            user_id: user.id,
            previous_version: {},
            new_version: newVersion,
            development_type: 'refinement', // 'new_variation' isn't in the enum
            change_summary: `Created as a variation of existing idea`,
            ai_confidence_score: 1.0
          });
      } catch (historyError) {
        console.error('Error tracking history:', historyError);
      }
    }

    return NextResponse.json({ idea: newIdea });

  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: idea, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    return NextResponse.json({ idea });

  } catch (error) {
    console.error('Error fetching idea:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if idea exists and belongs to user
    const { data: idea, error: fetchError } = await supabase
      .from('ideas')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Delete the idea (cascades should handle related records)
    const { error: deleteError } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting idea:', deleteError);
      return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting idea:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
