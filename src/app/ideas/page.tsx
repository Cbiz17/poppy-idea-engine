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

  // Fetch user's ideas
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching ideas:', error)
  }

  return (
    <AuthLayout>
      <IdeasGallery user={user} ideas={ideas || []} />
    </AuthLayout>
  )
}
