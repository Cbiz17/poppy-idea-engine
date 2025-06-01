import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import IdeasGallery from '@/components/ideas/IdeasGallery'
import AuthLayout from '@/components/layout/AuthLayout'

export default async function IdeasPage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch user's ideas with contributors
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select(`
      *,
      idea_contributors!left (
        user_id,
        contribution_type,
        contributed_at,
        profiles!idea_contributors_user_id_fkey (
          email,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching ideas:', error)
  }

  // Transform contributors data
  const ideasWithContributors = ideas?.map(idea => ({
    ...idea,
    contributors: idea.idea_contributors?.map((contributor: any) => ({
      user_id: contributor.user_id,
      email: contributor.profiles?.email,
      full_name: contributor.profiles?.full_name,
      avatar_url: contributor.profiles?.avatar_url,
      contribution_type: contributor.contribution_type,
      contributed_at: contributor.contributed_at
    })) || []
  })) || []

  return (
    <AuthLayout>
      <IdeasGallery user={user} ideas={ideasWithContributors} />
    </AuthLayout>
  )
}
