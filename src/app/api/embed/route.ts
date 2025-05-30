import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// IMPORTANT: Set the OPENAI_API_KEY environment variable in your .env.local file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

// Define the embedding model and dimension
// OpenAI's text-embedding-ada-002 produces 1536-dimensional embeddings
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const EMBEDDING_DIMENSION = 1536; // Should match your DB schema

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid text payload' }, { status: 400 });
    }

    // OpenAI API recommends replacing newlines with spaces for better embedding performance.
    const inputText = text.replace(/\n/g, ' ');

    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputText,
    });

    const embedding = embeddingResponse?.data?.[0]?.embedding;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      console.error('Failed to generate valid embedding or dimension mismatch:', embeddingResponse);
      return NextResponse.json({ error: 'Failed to generate valid embedding' }, { status: 500 });
    }

    return NextResponse.json({ embedding });

  } catch (error: any) {
    console.error('[API/EMBED ERROR]', error);
    let errorMessage = 'Internal Server Error';
    let errorStatus = 500;

    if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
      // Specific OpenAI API error structure
      errorMessage = error.response.data.error.message;
      errorStatus = error.response.status || 500;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
} 