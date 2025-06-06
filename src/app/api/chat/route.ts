import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// IMPORTANT: Set the ANTHROPIC_API_KEY environment variable in your .env.local file
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'edge'; // Specify edge runtime for Vercel

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string; // Assuming content is always a simple string from our frontend
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response('Missing ANTHROPIC_API_KEY.', { status: 500 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages payload', { status: 400 });
    }

    // Convert our message format to Anthropic's format
    // Ensure content is treated as a flat string, as Anthropic.Messages.MessageParam expects TextBlock content.
    const anthropicMessages: Anthropic.Messages.MessageParam[] = messages.map((msg: ChatMessage) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content, // Directly pass the string content
    }));

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
        (firstMessageContent.startsWith("Let's continue working on your idea:") || firstMessageContent.startsWith("Hello! I'm Poppy"))) {
       filteredMessages.shift();
     }
    
    if (filteredMessages.length === 0) {
      return new Response('No valid messages to process after filtering.', { status: 400 });
    }
    if (filteredMessages[filteredMessages.length - 1].role === 'assistant') {
      return new Response('Last message must be from user.', { status: 400 });
    }

    // Get dynamic system prompt
    const systemMessage = await getDynamicSystemPrompt();

    const anthropicStream = await anthropic.messages.stream({
        messages: filteredMessages,
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        system: systemMessage,
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

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('[API/CHAT ERROR]', error);
    if (error instanceof Anthropic.APIError) {
      return new Response(error.message || 'Error from Anthropic API', { status: error.status || 500 });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Function to get dynamic system prompt with A/B testing support
async function getDynamicSystemPrompt(): Promise<string> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user to check for A/B test assignment
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if user is part of any active A/B test
      const { data: testVariant } = await supabase
        .rpc('get_user_test_variant', {
          p_user_id: user.id,
          p_test_type: 'prompt_variation'
        });

      console.log('[A/B Testing] User test variant:', testVariant);

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
            console.log('[A/B Testing] Using test variant prompt:', {
              testId: assignment.test_id,
              group: assignment.variant_group,
              promptVersion: variantPrompt.performance_metrics?.prompt_version || 'unknown'
            });
            
            // Track that this variant was used
            await supabase
              .from('user_actions')
              .insert({
                user_id: user.id,
                action_type: 'ab_test_impression',
                action_context: {
                  test_id: assignment.test_id,
                  variant_group: assignment.variant_group,
                  prompt_id: promptId
                }
              });

            return variantPrompt.prompt_content;
          }
        }
      }
    }
    
    // If no A/B test assignment or user not authenticated, get the active prompt
    const { data: activePrompt } = await supabase
      .from('dynamic_prompts')
      .select('prompt_content, performance_metrics')
      .eq('prompt_type', 'system_message')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (activePrompt?.prompt_content) {
      console.log('Using active system prompt, version:', activePrompt.performance_metrics?.prompt_version || 'unknown');
      return activePrompt.prompt_content;
    }

    // Fallback to default prompt
    console.log('Using default system prompt (no dynamic prompt active)');
    return getDefaultSystemPrompt();
    
  } catch (error) {
    console.error('Error fetching dynamic prompt, using default:', error);
    return getDefaultSystemPrompt();
  }
}

function getDefaultSystemPrompt(): string {
  return "You are Poppy, an AI assistant for the Poppy Idea Engine. Your goal is to help users explore, develop, and organize their ideas. Be insightful, encouraging, and help them break down complex thoughts into actionable concepts. When appropriate, subtly guide them towards saving well-formed ideas. Keep your responses concise and focused on the user's last input unless asked for more detail.";
}
 