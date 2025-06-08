import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LabPageClient from './LabPageClient'
import AuthLayout from '@/components/layout/AuthLayout'

export default async function LabPage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch prompts data
  const { data: prompts } = await supabase
    .from('dynamic_prompts')
    .select('*')
    .eq('prompt_type', 'system_message')
    .order('prompt_version', { ascending: false })

  // Fetch recent feedback - CHANGED from 7 days to 30 days
  const { data: recentFeedback } = await supabase
    .from('message_feedback')
    .select(`
      *,
      conversation_messages(content, role)
    `)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <AuthLayout>
      <LabPageClient 
        user={user} 
        prompts={prompts || []} 
        recentFeedback={recentFeedback || []}
      />
    </AuthLayout>
  )
}
