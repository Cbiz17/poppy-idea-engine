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

  // Fetch contributors for all ideas
  let ideasWithContributors = ideas || []
  
  if (ideas && ideas.length > 0) {
    try {
      // Get all contributors for the user's ideas
      const { data: contributors, error: contributorsError } = await supabase
        .rpc('get_idea_contributors_batch', {
          idea_ids: ideas.map(idea => idea.id)
        })
      
      if (!contributorsError && contributors) {
        // Group contributors by idea_id
        const contributorsByIdea = contributors.reduce((acc: any, contributor: any) => {
          if (!acc[contributor.idea_id]) {
            acc[contributor.idea_id] = []
          }
          acc[contributor.idea_id].push(contributor)
          return acc
        }, {})
        
        // Add contributors to each idea
        ideasWithContributors = ideas.map(idea => ({
          ...idea,
          contributors: contributorsByIdea[idea.id] || []
        }))
      }
    } catch (error) {
      console.error('Error fetching contributors:', error)
      // Continue without contributors
    }
  }

  return <IdeasGallery user={user} ideas={ideasWithContributors} />
} 