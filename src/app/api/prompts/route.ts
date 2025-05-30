import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get active system prompt
    const { data: activePrompt } = await supabase
      .from('dynamic_prompts')
      .select('*')
      .eq('prompt_type', 'system_message')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ 
      activePrompt: activePrompt?.prompt_content || getDefaultPrompt(),
      promptData: activePrompt 
    });

  } catch (error) {
    console.error('Error fetching active prompt:', error);
    return NextResponse.json({ 
      activePrompt: getDefaultPrompt(),
      promptData: null,
      error: 'Failed to fetch active prompt' 
    });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    const supabase = await createServerSupabaseClient();

    if (action === 'analyze_and_improve') {
      return await analyzeAndImprovePrompts(supabase);
    } else if (action === 'create_variant') {
      const { promptContent, description } = await req.json();
      return await createPromptVariant(supabase, promptContent, description);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in prompts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function analyzeAndImprovePrompts(supabase: SupabaseClient) {
  try {
    // 1. Get recent feedback data
    const { data: recentFeedback } = await supabase
      .from('message_feedback')
      .select(`
        *,
        conversation_messages!inner(content, role),
        conversations!inner(*)
      `)
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // Last 14 days
      .order('created_at', { ascending: false })
      .limit(100);

    if (!recentFeedback || recentFeedback.length < 10) {
      return NextResponse.json({ 
        message: 'Not enough feedback data yet. Need at least 10 feedback entries.',
        feedbackCount: recentFeedback?.length || 0
      });
    }

    // 2. Analyze high-rated vs low-rated responses
    const highRatedResponses = recentFeedback
      .filter(f => (f.feedback_value >= 4 || f.feedback_type === 'thumbs_up'))
      .map(f => ({
        content: f.conversation_messages.content,
        rating: f.feedback_value,
        tags: f.context_tags || []
      }));

    const lowRatedResponses = recentFeedback
      .filter(f => (f.feedback_value <= 2 || f.feedback_type === 'thumbs_down'))
      .map(f => ({
        content: f.conversation_messages.content,
        rating: f.feedback_value,
        tags: f.context_tags || []
      }));

    if (highRatedResponses.length < 5) {
      return NextResponse.json({ 
        message: 'Not enough high-rated responses to analyze patterns.',
        highRatedCount: highRatedResponses.length
      });
    }

    // 3. Generate improved prompt using AI analysis
    const improvedPrompt = await generateImprovedPrompt(
      highRatedResponses, 
      lowRatedResponses
    );

    if (!improvedPrompt) {
      return NextResponse.json({ error: 'Failed to generate improved prompt' }, { status: 500 });
    }

    // 4. Store the new prompt
    const { data: newPrompt, error } = await supabase
      .from('dynamic_prompts')
      .insert({
        prompt_type: 'system_message',
        prompt_content: improvedPrompt.content,
        prompt_version: await getNextPromptVersion(supabase),
        performance_metrics: {
          based_on_feedback_count: recentFeedback.length,
          high_rated_responses: highRatedResponses.length,
          low_rated_responses: lowRatedResponses.length,
          common_positive_tags: improvedPrompt.positivePatterns,
          improvement_focus: improvedPrompt.improvementAreas
        },
        a_b_test_group: 'candidate',
        is_active: false // Don't activate automatically
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing new prompt:', error);
      return NextResponse.json({ error: 'Failed to store improved prompt' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Generated improved prompt candidate',
      newPrompt: newPrompt,
      analysis: {
        feedbackAnalyzed: recentFeedback.length,
        highRatedCount: highRatedResponses.length,
        lowRatedCount: lowRatedResponses.length,
        improvementAreas: improvedPrompt.improvementAreas
      }
    });

  } catch (error) {
    console.error('Error analyzing and improving prompts:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

interface FeedbackResponse {
  content: string;
  rating: number;
  tags: string[];
}

async function generateImprovedPrompt(highRated: FeedbackResponse[], lowRated: FeedbackResponse[]): Promise<any | null> {
  try {
    // Create analysis prompt for Claude
    const analysisPrompt = `Analyze these AI response patterns to create an improved system prompt:

HIGH-RATED RESPONSES (users loved these):
${highRated.slice(0, 5).map((r, i) => `${i + 1}. "${r.content.substring(0, 200)}..." 
   Rating: ${r.rating}/5, Tags: ${r.tags.join(', ')}`).join('\n\n')}

LOW-RATED RESPONSES (users disliked these):
${lowRated.slice(0, 3).map((r, i) => `${i + 1}. "${r.content.substring(0, 200)}..." 
   Rating: ${r.rating}/5`).join('\n\n')}

Current system prompt: "${getDefaultPrompt()}"

Based on this feedback analysis:
1. What patterns make responses highly rated?
2. What should be avoided based on low ratings?
3. Create an improved system prompt that incorporates successful patterns.

Respond with JSON:
{
  "positivePatterns": ["pattern1", "pattern2", "pattern3"],
  "improvementAreas": ["area1", "area2"],
  "content": "Your improved system prompt here - be specific about tone, approach, and what makes responses valuable"
}`;

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: analysisPrompt }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI analysis');
    }

    // Read streamed response
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

    // Parse JSON response
    try {
      return JSON.parse(fullResponse.trim());
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', fullResponse);
      return null;
    }

  } catch (error) {
    console.error('Error generating improved prompt:', error);
    return null;
  }
}

async function getNextPromptVersion(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase
    .from('dynamic_prompts')
    .select('prompt_version')
    .eq('prompt_type', 'system_message')
    .order('prompt_version', { ascending: false })
    .limit(1)
    .single();

  return (data?.prompt_version || 0) + 1;
}

async function createPromptVariant(supabase: SupabaseClient, content: string, description: string) {
  const { data, error } = await supabase
    .from('dynamic_prompts')
    .insert({
      prompt_type: 'system_message',
      prompt_content: content,
      prompt_version: await getNextPromptVersion(supabase),
      performance_metrics: { description, created_manually: true },
      is_active: false
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
  }

  return NextResponse.json({ success: true, variant: data });
}

function getDefaultPrompt(): string {
  return "You are Poppy, an AI assistant for the Poppy Idea Engine. Your goal is to help users explore, develop, and organize their ideas. Be insightful, encouraging, and help them break down complex thoughts into actionable concepts. When appropriate, subtly guide them towards saving well-formed ideas. Keep your responses concise and focused on the user's last input unless asked for more detail.";
}
