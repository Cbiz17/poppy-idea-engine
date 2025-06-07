import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createMiddlewareSupabaseClient(request, supabaseResponse)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Only protect specific routes that require authentication
  const protectedPaths = ['/dashboard', '/chat', '/ideas', '/conversations', '/profile', '/admin', '/onboarding']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (!user && isProtectedPath) {
    // Redirect to home page for unauthenticated users trying to access protected routes
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
