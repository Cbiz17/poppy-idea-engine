import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'edge';

interface DetectionRequest {
  messages: Array<{role: string, content: string}>;
  timeThresholdHours?: number;
}

export async function POST(req: Request) {
  try {
    const { messages, timeThresholdHours = 24 }: DetectionRequest = await req.json();
    const supabase = await createServerSupabaseClient();

    // Get user for personalized detection
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract recent user messages for context analysis
    const recentUserMessages = messages
      .filter(m => m.role === 'user')
      .slice(-3) // Last 3 user messages
      .map(m => m.content);

    if (recentUserMessages.length === 0) {
      return new Response(JSON.stringify({ 
        continuationDetected: false, 
        confidence: 0 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call smart detection function
    const detectionResults = await detectConversationContinuation(
      supabase,
      user.id,
      recentUserMessages,
      timeThresholdHours
    );

    return new Response(JSON.stringify(detectionResults), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[API/DETECT-CONTINUATION ERROR]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function detectConversationContinuation(
  supabase: any,
  userId: string,
  userMessages: string[],
  timeThresholdHours: number
) {
  try {
    // Step 1: Text-based keyword detection
    const combinedText = userMessages.join(' ').toLowerCase();
    
    // Step 2: Get recent ideas for comparison
    const { data: recentIdeas, error } = await supabase
      .from('ideas')
      .select('id, title, content, category, updated_at')
      .eq('user_id', userId)
      .gte('updated_at', new Date(Date.now() - timeThresholdHours * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent ideas:', error);
      return { continuationDetected: false, confidence: 0 };
    }

    if (!recentIdeas || recentIdeas.length === 0) {
      return { continuationDetected: false, confidence: 0 };
    }

    // Step 3: Analyze for potential matches
    let bestMatch = null;
    let highestConfidence = 0;

    for (const idea of recentIdeas) {
      const confidence = calculateMatchConfidence(combinedText, idea);
      
      if (confidence > highestConfidence && confidence > 0.3) {
        highestConfidence = confidence;
        bestMatch = idea;
      }
    }

    if (!bestMatch || highestConfidence < 0.3) {
      return { continuationDetected: false, confidence: 0 };
    }

    // Step 4: Determine suggested action based on confidence and context
    const suggestedAction = determineSuggestedAction(highestConfidence, combinedText, bestMatch);

    // Step 5: Get development history for context
    const { data: developmentHistory } = await supabase
      .from('idea_development_history')
      .select('development_type, change_summary, created_at')
      .eq('idea_id', bestMatch.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const timeSinceUpdate = Math.round(
      (Date.now() - new Date(bestMatch.updated_at).getTime()) / (1000 * 60 * 60)
    );

    return {
      continuationDetected: true,
      confidence: highestConfidence,
      relatedIdeaId: bestMatch.id,
      relatedIdeaTitle: bestMatch.title,
      relatedIdeaContent: bestMatch.content,
      relatedIdeaCategory: bestMatch.category,
      suggestedAction,
      detectionMethod: 'smart_detection',
      timeSinceLastUpdate: timeSinceUpdate,
      previousDevelopments: developmentHistory?.map(h => ({
        date: new Date(h.created_at).toLocaleDateString(),
        summary: h.change_summary || `${h.development_type} development`,
        type: h.development_type
      })) || []
    };

  } catch (error) {
    console.error('Error in detectConversationContinuation:', error);
    return { continuationDetected: false, confidence: 0 };
  }
}

function calculateMatchConfidence(userText: string, idea: any): number {
  const ideaText = `${idea.title} ${idea.content}`.toLowerCase();
  let confidence = 0;

  // Direct title mention (high confidence)
  const titleWords = idea.title.toLowerCase().split(' ').filter(word => word.length > 3);
  const titleMatches = titleWords.filter(word => userText.includes(word)).length;
  if (titleMatches > 0) {
    confidence += (titleMatches / titleWords.length) * 0.4;
  }

  // Content keyword overlap
  const ideaKeywords = extractKeywords(ideaText);
  const userKeywords = extractKeywords(userText);
  const keywordOverlap = ideaKeywords.filter(keyword => userKeywords.includes(keyword)).length;
  if (keywordOverlap > 0) {
    confidence += Math.min(keywordOverlap / Math.max(ideaKeywords.length, 1), 0.3) * 0.3;
  }

  // Category-specific terms
  const categoryTerms = getCategoryTerms(idea.category);
  const categoryMatches = categoryTerms.filter(term => userText.includes(term)).length;
  if (categoryMatches > 0) {
    confidence += Math.min(categoryMatches / categoryTerms.length, 0.2) * 0.2;
  }

  // Continuation indicators
  const continuationPhrases = [
    'continue', 'build on', 'expand', 'develop further', 'add to',
    'improve', 'enhance', 'refine', 'iterate', 'evolve'
  ];
  const continuationMatches = continuationPhrases.filter(phrase => userText.includes(phrase)).length;
  if (continuationMatches > 0) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - remove common words
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
  
  return text
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, '').toLowerCase())
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 20); // Top 20 keywords
}

function getCategoryTerms(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    'Business': ['business', 'startup', 'revenue', 'market', 'customer', 'product', 'service', 'strategy', 'plan'],
    'Technology': ['app', 'software', 'code', 'api', 'system', 'platform', 'tech', 'digital', 'web'],
    'Creative': ['design', 'art', 'creative', 'story', 'visual', 'aesthetic', 'concept', 'artistic'],
    'Learning': ['learn', 'study', 'course', 'skill', 'knowledge', 'education', 'training', 'research'],
    'Health & Wellness': ['health', 'fitness', 'wellness', 'exercise', 'nutrition', 'mental', 'physical'],
    'Travel': ['travel', 'trip', 'vacation', 'destination', 'journey', 'adventure', 'explore'],
    'Finance': ['money', 'budget', 'investment', 'finance', 'savings', 'cost', 'expense', 'income'],
    'Productivity': ['productivity', 'workflow', 'efficiency', 'organize', 'system', 'process', 'method'],
    'Personal Growth': ['personal', 'growth', 'self', 'life', 'development', 'improvement', 'goals']
  };
  
  return categoryMap[category] || ['general', 'idea', 'concept', 'plan'];
}

function determineSuggestedAction(confidence: number, userText: string, idea: any): 'update' | 'merge' | 'new_variation' {
  // High confidence + continuation indicators = update
  if (confidence > 0.7 && (userText.includes('continue') || userText.includes('build') || userText.includes('expand'))) {
    return 'update';
  }
  
  // Medium-high confidence + refinement indicators = merge
  if (confidence > 0.5 && (userText.includes('refine') || userText.includes('improve') || userText.includes('enhance'))) {
    return 'merge';
  }
  
  // Medium confidence + different direction = new_variation
  if (confidence > 0.4 && (userText.includes('different') || userText.includes('alternative') || userText.includes('another'))) {
    return 'new_variation';
  }
  
  // Default based on confidence level
  if (confidence > 0.6) return 'update';
  if (confidence > 0.4) return 'merge';
  return 'new_variation';
}
