import { NextResponse } from 'next/server'

export async function GET() {
  // Simple API endpoint to test if basic JavaScript works
  const testData = {
    status: 'API is working',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  }
  
  return NextResponse.json(testData)
}
