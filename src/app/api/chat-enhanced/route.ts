import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'edge';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages, userContext, feedbackInsights } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response('Missing ANTHROPIC_API_KEY.', { status: 500 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages payload', { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    
    // Get user for personalized improvements
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get dynamic system prompt based on learning patterns
    const systemMessage = await getDynamicSystemPrompt(supabase, user?.id, messages, userContext, feedbackInsights);

    // Get relevant learning patterns for this conversation context
    const relevantPatterns = await getRelevantLearningPatterns(supabase, messages);

    // Enhance system message with learned patterns
    const enhancedSystemMessage = enhanceSystemMessageWithPatterns(systemMessage, relevantPatterns);

    // Convert our message format to Anthropic's format
    const anthropicMessages: Anthropic.Messages.MessageParam[] = messages.map((msg: ChatMessage) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Filter and clean messages
    let filteredMessages: Anthropic.Messages.MessageParam[] = [];
    if (anthropicMessages.length > 0) {
      filteredMessages.push(anthropicMessages[0]);
      for (let i = 1; i < anthropicMessages.length; i++) {
        if (anthropicMessages[i].role !== anthropicMessages[i - 1].role) {
          filteredMessages.push(anthropicMessages[i]);
        } else {
          filteredMessages[filteredMessages.length - 1] = anthropicMessages[i];
        }
      }
    }
    
    const firstMessageContent = filteredMessages[0]?.content;
    if (typeof firstMessageContent === 'string' && 
        (firstMessageContent.startsWith("Let's continue working on your idea:") || firstMessageContent.startsWith("Hello! I'm Claude"))) {
       filteredMessages.shift();
     }
    
    if (filteredMessages.length === 0) {
      return new Response('No valid messages to process after filtering.', { status: 400 });
    }
    if (filteredMessages[filteredMessages.length - 1].role === 'assistant') {
      return new Response('Last message must be from user.', { status: 400 });
    }

    // Use enhanced system message with learning patterns
    const anthropicStream = await anthropic.messages.stream({
        messages: filteredMessages,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 2048,
        system: enhancedSystemMessage,
    });
    
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of anthropicStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
          if (event.type === 'message_stop') {
            controller.close();
          }
        }
      },
      cancel() {
        console.log('Stream cancelled by client.');
      }
    });

    // Track usage of patterns for learning
    if (user && relevantPatterns.length > 0) {
      trackPatternUsage(supabase, relevantPatterns, user.id);
    }

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('[API/CHAT-ENHANCED ERROR]', error);
    if (error instanceof Anthropic.APIError) {
      return new Response(error.message || 'Error from Anthropic API', { status: error.status || 500 });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function getDynamicSystemPrompt(supabase: SupabaseClient, userId?: string, messages?: ChatMessage[], userContext?: any, feedbackInsights?: any): Promise<string> {
  try {
    // First check for A/B test assignment if user is authenticated
    if (userId) {
      const { data: testVariant } = await supabase
        .rpc('get_user_test_variant', {
          p_user_id: userId,
          p_test_type: 'prompt_variation'
        });

      console.log('[A/B Testing - Enhanced] User test variant:', testVariant);

      // If user is assigned to a test variant, get that specific prompt
      if (testVariant && testVariant.length > 0) {
        const assignment = testVariant[0];
        const { data: testInfo } = await supabase
          .from('ab_tests')
          .select('variants')
          .eq('id', assignment.test_id)
          .single();

        if (testInfo) {
          const promptId = assignment.variant_group === 'control' 
            ? testInfo.variants.control.prompt_id 
            : testInfo.variants.variant.prompt_id;

          const { data: variantPrompt } = await supabase
            .from('dynamic_prompts')
            .select('prompt_content, performance_metrics')
            .eq('id', promptId)
            .single();

          if (variantPrompt?.prompt_content) {
            console.log('[A/B Testing - Enhanced] Using test variant prompt:', {
              testId: assignment.test_id,
              group: assignment.variant_group,
              promptVersion: variantPrompt.performance_metrics?.prompt_version || 'unknown'
            });
            
            // Track that this variant was used in enhanced mode
            await supabase
              .from('user_actions')
              .insert({
                user_id: userId,
                action_type: 'ab_test_impression_enhanced',
                action_context: {
                  test_id: assignment.test_id,
                  variant_group: assignment.variant_group,
                  prompt_id: promptId,
                  enhanced_mode: true
                }
              });

            // Apply personalization to the A/B test prompt
            return applyPersonalization(variantPrompt.prompt_content, userContext, feedbackInsights);
          }
        }
      }
    }
    
    // If no A/B test, continue with regular dynamic prompt selection
    // Analyze conversation context to determine the best prompt
    const conversationContext = analyzeConversationContext(messages || []);
    
    // Get the best performing prompt for this context
    const { data: dynamicPrompt } = await supabase
      .from('dynamic_prompts')
      .select('prompt_content, performance_metrics')
      .eq('prompt_type', 'system_message')
      .eq('is_active', true)
      .gte('performance_metrics->>success_rate', '0.7')
      .order('performance_metrics->>success_rate', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dynamicPrompt) {
      return applyPersonalization(dynamicPrompt.prompt_content, userContext, feedbackInsights);
    }

    // Fallback to context-aware default prompts
    if (conversationContext.isIdeaDevelopment) {
      return `You are Poppy, an AI assistant specialized in idea development for the Poppy Idea Engine. Focus on helping users:
1. Explore and refine their ideas thoroughly
2. Break down complex concepts into actionable components  
3. Identify key implementation steps and considerations
4. Suggest creative enhancements and alternative approaches
Be encouraging, insightful, and help them organize their thoughts into concrete, actionable ideas.`;
    }

    // Default with personalization
    const basePrompt = "You are Poppy, an AI assistant for the Poppy Idea Engine. Your goal is to help users explore, develop, and organize their ideas. Be insightful, encouraging, and help them break down complex thoughts into actionable concepts.";
    return applyPersonalization(basePrompt, userContext, feedbackInsights);

  } catch (error) {
    console.error('Error getting dynamic system prompt:', error);
    return "You are Poppy, an AI assistant for the Poppy Idea Engine. Your goal is to help users explore, develop, and organize their ideas. Be insightful, encouraging, and help them break down complex thoughts into actionable concepts.";
  }
}

function applyPersonalization(basePrompt: string, userContext?: any, feedbackInsights?: any): string {
  if (!userContext && !feedbackInsights) {
    return basePrompt;
  }

  const style = userContext?.preferences?.communicationStyle || "balanced";
  const length = userContext?.preferences?.responseLength || "adaptive";
  const interests = userContext?.interests?.slice(0, 3).join(", ") || "various topics";
  
  return `${basePrompt}

User Preferences:
- Communication style: ${style} (adjust formality accordingly)
- Response length: ${length} (provide ${length === "concise" ? "brief" : length === "detailed" ? "comprehensive" : "appropriately sized"} responses)
- Known interests: ${interests}
${feedbackInsights?.overallSatisfaction < 3 ? "- Note: User satisfaction has been low. Focus on clarity and relevance." : ""}
${feedbackInsights?.preferredResponseStyle ? `- Preferred style: ${feedbackInsights.preferredResponseStyle.tone} tone with ${feedbackInsights.preferredResponseStyle.detail} detail` : ""}`;
}

function analyzeConversationContext(messages: ChatMessage[]) {
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
  
  return {
    isIdeaDevelopment: conversationText.includes('idea') || conversationText.includes('concept') || conversationText.includes('plan'),
    isProblemSolving: conversationText.includes('problem') || conversationText.includes('challenge') || conversationText.includes('solution'),
    isBrainstorming: conversationText.includes('brainstorm') || conversationText.includes('creative') || conversationText.includes('explore'),
    messageCount: messages.length,
    avgMessageLength: messages.reduce((sum, m) => sum + m.content.length, 0) / Math.max(messages.length, 1)
  };
}

async function getRelevantLearningPatterns(supabase: SupabaseClient, messages: ChatMessage[]) {
  try {
    // Create embedding for current conversation context
    const conversationSummary = messages.slice(-3).map(m => m.content).join(' ');
    
    const embedResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: conversationSummary })
    });

    if (!embedResponse.ok) {
      return [];
    }

    const { embedding } = await embedResponse.json();
    
    // Find similar successful patterns
    const { data: patterns } = await supabase
      .rpc('match_learning_patterns', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 3
      });

    return patterns || [];
  } catch (error) {
    console.error('Error getting relevant patterns:', error);
    return [];
  }
}

function enhanceSystemMessageWithPatterns(systemMessage: string, patterns: any[]): string {
  if (patterns.length === 0) {
    return systemMessage;
  }

  const patternGuidance = patterns
    .filter(p => p.confidence_score > 0.6)
    .map(p => `- ${p.pattern_description}`)
    .join('\n');

  if (patternGuidance) {
    return `${systemMessage}

Based on successful past interactions, consider these approaches:
${patternGuidance}`;
  }

  return systemMessage;
}

async function trackPatternUsage(supabase: SupabaseClient, patterns: any[], userId: string) {
  try {
    for (const pattern of patterns) {
      await supabase
        .from('learning_patterns')
        .update({ 
          usage_count: pattern.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', pattern.id);
    }
  } catch (error) {
    console.error('Error tracking pattern usage:', error);
  }
}
