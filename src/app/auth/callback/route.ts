import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // Check if user needs onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single()
      
      const needsOnboarding = !profile?.onboarding_completed
      const redirectPath = needsOnboarding ? '/onboarding' : next
      
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
