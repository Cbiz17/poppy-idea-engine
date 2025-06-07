import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-ada-002';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

/**
 * Generate embeddings for text content
 * Falls back gracefully if OpenAI is not configured
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!openai) {
    console.warn('OpenAI not configured - skipping embedding generation');
    return null;
  }

  try {
    const inputText = text.replace(/\n/g, ' ').trim();
    
    if (!inputText) {
      return null;
    }

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputText,
    });
    
    return response?.data?.[0]?.embedding || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Generate embedding for idea content
 * Combines title and content for better semantic search
 */
export async function generateIdeaEmbedding(title: string, content: string): Promise<number[] | null> {
  const combinedText = `${title} ${content}`.substring(0, 8000); // Limit to avoid token limits
  return generateEmbedding(combinedText);
}
