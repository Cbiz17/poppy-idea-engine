/**
 * Utility functions for generating embeddings
 */

export async function generateIdeaEmbedding(title: string, content: string): Promise<number[] | null> {
  try {
    const embedResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: `${title}\n\n${content}` 
      }),
    });

    if (embedResponse.ok) {
      const embedData = await embedResponse.json();
      return embedData.embedding;
    }
    
    console.error('Failed to generate embedding:', embedResponse.statusText);
    return null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}
