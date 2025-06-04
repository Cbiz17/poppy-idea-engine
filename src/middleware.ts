import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser()

  // Handle auth errors gracefully
  if (error) {
    console.error('Middleware auth error:', error.message)
  }

  // Define protected routes
  const protectedPaths = ['/dashboard', '/chat', '/ideas', '/conversations', '/profile', '/admin', '/onboarding']
  const pathname = request.nextUrl.pathname
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // Handle auth callback separately - don't redirect during OAuth flow
  if (pathname.startsWith('/auth/callback')) {
    return response
  }

  // Redirect to home if accessing protected route without auth
  if (!user && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public assets)
     * - test pages (for debugging)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|test/.*|api/.*|auth/auth-code-error).*)',
  ],
}
