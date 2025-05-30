import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DiscoverClient from './DiscoverClient'

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch public ideas with user info
  const { data: publicIdeas } = await supabase
    .from('ideas')
    .select(`
      *,
      profiles!ideas_user_id_fkey (
        email,
        full_name,
        avatar_url
      ),
      idea_discovery_stats (
        view_count,
        like_count,
        comment_count,
        remix_count
      ),
      idea_likes!left (
        user_id
      )
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  // Transform the data to include like status for current user
  const ideasWithLikeStatus = publicIdeas?.map(idea => ({
    ...idea,
    isLikedByCurrentUser: idea.idea_likes?.some((like: any) => like.user_id === user.id) || false
  })) || []

  return <DiscoverClient user={user} ideas={ideasWithLikeStatus} />
}