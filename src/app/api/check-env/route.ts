import { NextResponse } from 'next/server'

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  }

  // Check if Supabase URL matches expected project
  const expectedUrl = 'https://eaahmigctnbqhaqptlvw.supabase.co'
  const urlMatches = env.NEXT_PUBLIC_SUPABASE_URL === expectedUrl

  return NextResponse.json({
    status: 'Environment Check',
    timestamp: new Date().toISOString(),
    environment: env,
    checks: {
      supabaseUrlMatches: urlMatches,
      hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasNextAuthUrl: !!env.NEXTAUTH_URL,
    },
    redirectUrl: env.NEXTAUTH_URL ? `${env.NEXTAUTH_URL}/auth/callback` : 'NOT SET'
  })
}
