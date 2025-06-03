import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AuthPage from '@/components/auth/AuthPage'

export default async function Home() {
  // Check if there's a force parameter to show auth page
  // This helps if you get stuck in a redirect loop
  
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
