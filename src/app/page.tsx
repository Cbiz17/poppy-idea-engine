import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AuthPage from '@/components/auth/AuthPage'

export default async function Home() {
  // Check if we need to force sign out
  const { searchParams } = new URL('http://localhost:3000')
  
  try {
    const supabase = await createServerSupabaseClient()
    
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth check error:', error)
      // If there's an error, show the auth page
      return <AuthPage />
    }

    // If authenticated, redirect to chat
    if (user) {
      redirect('/chat')
    }
  } catch (err) {
    console.error('Unexpected error in auth check:', err)
    // On any error, show the auth page
  }

  // Otherwise, show the authentication page
  return <AuthPage />
}
