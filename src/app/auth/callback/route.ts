import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Auth callback triggered')
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback params:', { code: !!code, error, error_description, next })

  // Check for OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    const errorUrl = new URL(`${origin}/auth/auth-code-error`)
    errorUrl.searchParams.set('error', error)
    if (error_description) {
      errorUrl.searchParams.set('description', error_description)
    }
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Code exchange result:', { error: exchangeError, hasData: !!data })
      
      if (!exchangeError && data?.user) {
        // Check if user needs onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', data.user.id)
          .single()
        
        const needsOnboarding = !profile?.onboarding_completed
        const redirectPath = needsOnboarding ? '/onboarding' : next
        
        console.log('Redirecting to:', redirectPath)
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else {
        console.error('Exchange error:', exchangeError)
      }
    } catch (err) {
      console.error('Callback error:', err)
    }
  }

  // Return the user to an error page with instructions
  console.log('No code or error, redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
