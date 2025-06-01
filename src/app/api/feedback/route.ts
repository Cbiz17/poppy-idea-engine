import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { devLogger } from '@/lib/dev-logger';

export async function POST(req: Request) {
  try {
    const { messageId, feedbackType, feedbackValue, feedbackText, contextTags } = await req.json();
    
    console.log('Feedback request received:', { messageId, feedbackType });
    
    const supabase = await createServerSupabaseClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      console.warn('Invalid message ID format:', messageId);
      // For non-UUID message IDs (like temporary ones), just return success
      // This prevents errors for welcome messages, etc.
      return NextResponse.json({ 
        success: true, 
        feedback: { 
          id: 'temp-' + Date.now(),
          feedback_type: feedbackType,
          feedback_value: feedbackValue
        },
        message: 'Feedback acknowledged (temporary message)' 
      });
    }

    // Get message details to find conversation
    let conversationId: string | null = null;
    const { data: message, error: messageError } = await supabase
      .from('conversation_messages')
      .select('conversation_id, user_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      console.error('Message not found:', messageId, messageError);
      // Message might not be saved yet or might be from another user
      // Let's try to find the user's most recent conversation
      const { data: recentConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      if (recentConv) {
        // Store feedback with the recent conversation
        console.log('Using recent conversation for feedback:', recentConv.id);
        
        // Create a placeholder message record
        const { data: newMessage } = await supabase
          .from('conversation_messages')
          .insert({
            id: messageId,
            conversation_id: recentConv.id,
            user_id: user.id,
            role: 'assistant',
            content: '[Feedback placeholder - message content not stored]'
          })
          .select()
          .single();
          
        if (newMessage) {
          // Successfully created placeholder message
          conversationId = recentConv.id;
        } else {
          // If we can't create the message, just acknowledge the feedback
          return NextResponse.json({ 
            success: true, 
            feedback: { 
              id: 'ack-' + Date.now(),
              feedback_type: feedbackType,
              feedback_value: feedbackValue
            },
            message: 'Feedback acknowledged' 
          });
        }
      } else {
        // No conversation found, just acknowledge
        return NextResponse.json({ 
          success: true, 
          feedback: { 
            id: 'no-conv-' + Date.now(),
            feedback_type: feedbackType,
            feedback_value: feedbackValue
          },
          message: 'Feedback acknowledged (no conversation)' 
        });
      }
    } else {
      // Message exists, verify it belongs to the user
      if (message.user_id !== user.id) {
        console.error('Message does not belong to user');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      conversationId = message.conversation_id;
    }

    // Store feedback if we have a conversation ID
    if (!conversationId) {
      return NextResponse.json({ 
        success: true, 
        feedback: { 
          id: 'no-conv-' + Date.now(),
          feedback_type: feedbackType,
          feedback_value: feedbackValue
        },
        message: 'Feedback acknowledged (no conversation)' 
      });
    }

    const { data: feedback, error } = await supabase
      .from('message_feedback')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        message_id: messageId,
        feedback_type: feedbackType,
        feedback_value: feedbackValue,
        feedback_text: feedbackText,
        context_tags: contextTags
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing feedback:', error);
      // Even if storage fails, acknowledge the feedback
      return NextResponse.json({ 
        success: true, 
        feedback: { 
          id: 'error-ack-' + Date.now(),
          feedback_type: feedbackType,
          feedback_value: feedbackValue
        },
        message: 'Feedback acknowledged (storage issue)' 
      });
    }

    console.log('Feedback stored successfully:', feedback.id);

    // Get updated gamification data
    const { data: gamificationData, error: gamificationError } = await supabase
      .rpc('get_user_feedback_gamification_data', { p_user_id: user.id });

    if (gamificationError) {
      console.error('Error fetching gamification data:', gamificationError);
    }

    // Check if any new achievements were unlocked
    let newAchievements: any[] = [];
    if (gamificationData?.achievements) {
      // Get achievements that were unlocked in the last minute
      const oneMinuteAgo = new Date(Date.now() - 60000);
      newAchievements = gamificationData.achievements.filter((a: any) => 
        new Date(a.unlockedAt) > oneMinuteAgo
      );
    }

    // Trigger learning analysis asynchronously
    analyzeFeedbackPattern(supabase, user.id, feedbackType, feedbackValue);

    return NextResponse.json({ 
      success: true, 
      feedback,
      gamification: gamificationData,
      newAchievements
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    // Always return success to not disrupt user experience
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback acknowledged',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Async function to analyze patterns and update learning
async function analyzeFeedbackPattern(supabase: SupabaseClient, userId: string, feedbackType: string, feedbackValue: number) {
  try {
    // Analyze recent feedback patterns
    const { data: recentFeedback } = await supabase
      .from('message_feedback')
      .select(`
        *,
        conversation_messages!inner(content, role),
        conversations!inner(*)
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })
      .limit(50);

    if (recentFeedback && recentFeedback.length >= 10) {
      // Extract patterns from highly-rated responses
      const positivePatterns = recentFeedback
        .filter(f => f.feedback_value >= 4 || f.feedback_type === 'thumbs_up')
        .map(f => ({
          content: f.conversation_messages.content,
          context: f.context_tags,
          satisfaction: f.feedback_value
        }));

      if (positivePatterns.length >= 3) {
        // Use AI to extract common patterns
        await extractAndStoreLearningPattern(supabase, positivePatterns, 'positive_response_pattern');
      }
    }
  } catch (error) {
    console.error('Error in pattern analysis:', error);
  }
}

interface FeedbackExample {
  content: string;
  context?: string[];
  satisfaction: number;
  rating?: number;
  tags?: string[];
}

async function extractAndStoreLearningPattern(supabase: SupabaseClient, examples: FeedbackExample[], patternType: string) {
  try {
    // Create prompt for Claude to analyze patterns
    const analysisPrompt = `Analyze these successful AI responses and extract common patterns:

${examples.map((ex, i) => `Example ${i + 1} (satisfaction: ${ex.satisfaction}):\n${ex.content}\nContext: ${ex.context?.join(', ') || 'none'}\n`).join('\n---\n')}

Please identify:
1. Common linguistic patterns
2. Response structure patterns  
3. Content approach patterns
4. Length and tone patterns

Respond with JSON in this format:
{
  "pattern_name": "descriptive name",
  "pattern_description": "detailed description",
  "success_factors": ["factor1", "factor2", "factor3"],
  "recommended_usage": "when to use this pattern"
}`;

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: analysisPrompt }]
      })
    });

    if (response.ok) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      try {
        const pattern = JSON.parse(fullResponse.trim());
        
        // Generate embedding for the pattern
        const embedResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/embed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pattern.pattern_description })
        });

        let embedding = null;
        if (embedResponse.ok) {
          const { embedding: patternEmbedding } = await embedResponse.json();
          embedding = patternEmbedding;
        }

        // Store the learning pattern
        await supabase
          .from('learning_patterns')
          .insert({
            pattern_type: patternType,
            pattern_name: pattern.pattern_name,
            pattern_description: pattern.pattern_description,
            success_metrics: {
              success_factors: pattern.success_factors,
              recommended_usage: pattern.recommended_usage,
              example_count: examples.length,
              avg_satisfaction: examples.reduce((sum, ex) => sum + ex.satisfaction, 0) / examples.length
            },
            confidence_score: Math.min(examples.length / 10, 1), // Higher confidence with more examples
            embedding
          });

        console.log('Successfully stored learning pattern:', pattern.pattern_name);
      } catch (parseError) {
        console.error('Failed to parse pattern analysis:', parseError);
      }
    }
  } catch (error) {
    console.error('Error extracting learning pattern:', error);
  }
}

// GET endpoint to fetch user's gamification stats
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: gamificationData, error } = await supabase
      .rpc('get_user_feedback_gamification_data', { p_user_id: user.id });

    if (error) {
      devLogger.error('feedback-api', 'Error fetching gamification data', { error });
      return NextResponse.json({ 
        error: 'Failed to fetch stats',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: gamificationData
    });

  } catch (error) {
    devLogger.error('feedback-api', 'Unexpected error in GET', { error });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
