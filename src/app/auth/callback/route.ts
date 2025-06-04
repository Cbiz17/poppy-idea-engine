import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  // Log for debugging in production
  console.log('[Auth Callback] Started', {
    hasCode: !!code,
    error,
    error_description,
    next,
    origin
  })

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', { error, error_description })
    const errorUrl = new URL(`${origin}/auth/auth-code-error`)
    errorUrl.searchParams.set('error', error)
    if (error_description) {
      errorUrl.searchParams.set('description', error_description)
    }
    return NextResponse.redirect(errorUrl)
  }

  if (!code) {
    console.error('[Auth Callback] No authorization code received')
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // This can happen in read-only environments
              console.error('[Auth Callback] Cookie set error:', error)
            }
          },
        },
      }
    )

    // Exchange code for session
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError)
      const errorUrl = new URL(`${origin}/auth/auth-code-error`)
      errorUrl.searchParams.set('error', 'exchange_failed')
      errorUrl.searchParams.set('description', exchangeError.message)
      return NextResponse.redirect(errorUrl)
    }

    if (!data?.user) {
      console.error('[Auth Callback] No user data after exchange')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_user`)
    }

    console.log('[Auth Callback] Success, user:', data.user.email)

    // Check onboarding status
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single()

      const needsOnboarding = !profile?.onboarding_completed
      const redirectPath = needsOnboarding ? '/onboarding' : next

      console.log('[Auth Callback] Redirecting to:', redirectPath)
      
      // Use a response with proper cookie headers
      const response = NextResponse.redirect(`${origin}${redirectPath}`)
      
      // Ensure cookies are properly set in the response
      cookieStore.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          response.cookies.set(
            cookie.name,
            cookie.value,
            {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            }
          )
        }
      })

      return response
    } catch (profileError) {
      console.error('[Auth Callback] Profile check error:', profileError)
      // Continue to redirect even if profile check fails
      const response = NextResponse.redirect(`${origin}${next}`)
      
      // Ensure cookies are set
      cookieStore.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          response.cookies.set(
            cookie.name,
            cookie.value,
            {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            }
          )
        }
      })

      return response
    }
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected`)
  }
}
