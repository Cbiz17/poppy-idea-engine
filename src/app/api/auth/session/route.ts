import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}