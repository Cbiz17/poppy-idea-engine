import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import IdeaDetailView from '@/components/ideas/IdeaDetailView'

export default async function IdeaDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch the idea with development history
  const { data: idea, error } = await supabase
    .from('ideas')
    .select(`
      *,
      idea_development_history (
        id,
        development_type,
        change_summary,
        created_at,
        version_number
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">Idea not found</h1>
        <Link href="/ideas" className="text-purple-600 hover:underline">
          Back to Ideas Gallery
        </Link>
      </div>
    )
  }

  return <IdeaDetailView user={user} idea={idea} />
}
