import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DebugPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Debug queries
  const debugInfo: any = {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    errors: [],
    troubleshooting: []
  }

  // Check ideas
  const { data: ideas, error: ideasError, count: ideasCount } = await supabase
    .from('ideas')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)

  if (ideasError) {
    debugInfo.errors.push({ 
      table: 'ideas', 
      error: ideasError,
      message: ideasError.message,
      code: ideasError.code 
    })
    debugInfo.troubleshooting.push('Error fetching ideas - check if ideas table exists and RLS policies are correct')
  } else {
    debugInfo.ideas = {
      count: ideasCount || 0,
      data: ideas || [],
      message: ideas?.length === 0 ? 'No ideas found - user needs to create ideas first' : 'Ideas found successfully'
    }
  }

  // Check conversations
  const { data: conversations, error: convsError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)

  if (convsError) {
    debugInfo.errors.push({ 
      table: 'conversations', 
      error: convsError,
      message: convsError.message 
    })
  } else {
    debugInfo.conversations = {
      count: conversations?.length || 0,
      hasConversations: conversations && conversations.length > 0
    }
  }

  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    debugInfo.errors.push({ 
      table: 'profiles', 
      error: profileError,
      message: profileError.message 
    })
    debugInfo.troubleshooting.push('Profile missing - user profile may not have been created on signup')
  } else {
    debugInfo.profile = {
      exists: true,
      data: profile
    }
  }

  // Test creating a sample idea
  debugInfo.canCreateIdea = 'Not tested - uncomment code below to test'
  /*
  const testIdea = {
    title: 'Test Idea from Debug Page',
    content: 'This is a test idea created from the debug page',
    category: 'General',
    user_id: user.id
  }
  
  const { data: createdIdea, error: createError } = await supabase
    .from('ideas')
    .insert(testIdea)
    .select()
    .single()
    
  if (createError) {
    debugInfo.canCreateIdea = false
    debugInfo.createError = createError
  } else {
    debugInfo.canCreateIdea = true
    debugInfo.createdIdea = createdIdea
    // Clean up - delete the test idea
    await supabase.from('ideas').delete().eq('id', createdIdea.id)
  }
  */

  // Summary
  if (debugInfo.ideas.count === 0 && debugInfo.errors.length === 0) {
    debugInfo.diagnosis = 'User has no ideas yet. They need to create ideas in the chat first.'
    debugInfo.solution = 'Go to /chat, have a conversation, and save an idea using the save button.'
  } else if (debugInfo.errors.length > 0) {
    debugInfo.diagnosis = 'There are errors accessing the database.'
    debugInfo.solution = 'Check the errors above and ensure database tables and RLS policies are properly set up.'
  } else {
    debugInfo.diagnosis = 'User has ideas and database access is working.'
    debugInfo.solution = 'The ideas gallery should be working. If not, check browser console for client-side errors.'
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Quick Diagnosis</h2>
        <p className="text-blue-900">{debugInfo.diagnosis}</p>
        <p className="text-blue-700 mt-2"><strong>Solution:</strong> {debugInfo.solution}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded overflow-auto">
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
        <div className="space-y-2">
          <a href="/chat" className="block p-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
            Go to Chat (Create Ideas Here)
          </a>
          <a href="/ideas" className="block p-3 bg-green-500 text-white rounded hover:bg-green-600 text-center">
            Go to Ideas Gallery
          </a>
          <a href="/admin" className="block p-3 bg-purple-500 text-white rounded hover:bg-purple-600 text-center">
            Go to Admin Dashboard
          </a>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Common Issues:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>No ideas showing = User hasn't created any ideas yet</li>
          <li>RLS errors = Row Level Security policies need to be checked</li>
          <li>Profile missing = User profile wasn't created on signup</li>
          <li>Can see ideas in debug but not in gallery = Client-side rendering issue</li>
        </ul>
      </div>
    </div>
  )
}
