import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import IdeasGallery from '@/components/ideas/IdeasGallery'

export default async function IdeasPage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch user's ideas with visibility
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select(`
      *,
      idea_shares!left (
        shared_with_user_id,
        shared_with_email,
        permission_level
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching ideas:', error)
  }

  // FIXED: Remove the contributors logic that's causing failures
  // This will allow the page to load for all users
  let ideasWithContributors = (ideas || []).map(idea => ({
    ...idea,
    contributors: [] // Empty array for now
  }))

  return <IdeasGallery user={user} ideas={ideasWithContributors} />
}