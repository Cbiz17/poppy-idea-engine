import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch the user's profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get idea statistics
  const { count: ideaCount } = await supabase
    .from('ideas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return <ProfileClient 
    user={user} 
    profile={profile} 
    stats={{ 
      ideas: ideaCount || 0, 
      conversations: conversationCount || 0 
    }} 
  />
}