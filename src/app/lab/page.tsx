import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function LabPage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="animate-pulse">⚡</span>
            Poppy Lab
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Where your feedback shapes the future of AI
          </p>
        </div>
        
        <AdminDashboard user={user} />
      </div>
    </div>
  )
}
