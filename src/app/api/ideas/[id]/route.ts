import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, content, category, conversationId, developmentType, metadata } = await req.json();
    const supabase = await createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
      // Continue without embedding update
    }

    // Update the idea
    interface UpdateData {
      title: string;
      content: string;
      category: string;
      updated_at: string;
      embedding?: any;
    }
    
    const updateData: UpdateData = {
      title,
      content,
      category,
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

    // Add contributor tracking for edits
    if (existingIdea.user_id !== user.id) {
      // If the editor is not the original owner, track them as a contributor
      try {
        await supabase
          .from('idea_contributors')
          .upsert({
            idea_id: id,
            user_id: user.id,
            contribution_type: 'edit',
            contributed_at: new Date().toISOString(),
            contribution_details: {
              previousTitle: existingIdea.title,
              previousContent: existingIdea.content,
              timestamp: new Date().toISOString()
            }
          }, {
            onConflict: 'idea_id,user_id,contribution_type'
          });
      } catch (contributorError) {
        console.error('Error tracking contributor:', contributorError);
        // Non-critical, continue
      }
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

      await supabase
        .from('idea_development_history')
        .insert({
          idea_id: id,
          conversation_id: conversationId || null,
          user_id: user.id,
          previous_title: existingIdea.title,
          new_title: title,
          previous_content: existingIdea.content,
          new_content: content,
          previous_category: existingIdea.category,
          new_category: category,
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
    return 'categorization_change';
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
    const { title, content, category, saveType, originalId } = await req.json();
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
    const { data: newIdea, error: createError } = await supabase
      .from('ideas')
      .insert({
        user_id: user.id,
        title,
        content,
        category,
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
        await supabase
          .from('idea_development_history')
          .insert({
            idea_id: newIdea.id,
            user_id: user.id,
            previous_title: '',
            new_title: title,
            previous_content: '',
            new_content: content,
            development_type: 'new_variation',
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
