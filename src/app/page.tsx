import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AuthPage from '@/components/auth/AuthPage'

export default async function Home() {
  // Check if user is already authenticated
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If authenticated, redirect to chat
  if (user) {
    redirect('/chat')
  }

  // Otherwise, show the authentication page
  return <AuthPage />
}
