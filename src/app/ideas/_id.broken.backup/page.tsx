import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react'

export default async function SingleIdeaPage({ 
  params 
}: { 
  params: { id: string }
}) {
  const { id } = params
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/ideas" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            Back to Gallery
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Poppy Idea Engine</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="mb-8">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-4">
              {idea.category}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {idea.title}
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              Last updated: {new Date(idea.updated_at).toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 mb-10 whitespace-pre-wrap">
            {idea.content}
          </div>

          <div className="border-t border-gray-200 pt-8">
            <Link
              href={`/chat?idea=${idea.id}`}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Continue Developing Idea
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
