import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { originalContent, newContent, originalTitle, newTitle, mergeType } = await req.json()
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prepare the prompt for intelligent merging
    const prompt = `You are an expert at intelligently merging ideas. Please merge these two ideas into a cohesive, enhanced version.

Idea 1 - "${originalTitle}":
${originalContent}

Idea 2 - "${newTitle}":
${newContent}

Merge Type: ${mergeType || 'intelligent_merge'}

Please create a merged version that:
1. Combines the key concepts from both ideas
2. Eliminates redundancy while preserving unique insights
3. Creates a cohesive narrative flow
4. Enhances the overall value of the combined idea

Respond with a JSON object containing:
{
  "mergedContent": "The intelligently merged content",
  "enhancedTitle": "An enhanced title that captures the merged concept",
  "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "mergeSummary": "A brief explanation of how the ideas were merged"
}`

    // Call the chat API to generate the merge
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/chat-enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate smart merge')
    }

    // Read the streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullResponse += decoder.decode(value, { stream: true })
      }
      fullResponse += decoder.decode()
    }

    // Try to parse the AI response
    try {
      const parsed = JSON.parse(fullResponse.trim())
      return NextResponse.json({
        mergedContent: parsed.mergedContent || `${originalContent}\n\n---\n\n${newContent}`,
        enhancedTitle: parsed.enhancedTitle || `${originalTitle} + ${newTitle}`,
        insights: parsed.insights || [
          'Combined key concepts from both ideas',
          'Removed redundant information',
          'Created cohesive narrative flow'
        ],
        mergeSummary: parsed.mergeSummary || 'Ideas have been merged successfully'
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', fullResponse)
      // Fallback to simple merge
      return NextResponse.json({
        mergedContent: `${originalContent}\n\n--- Merged with: ${newTitle} ---\n\n${newContent}`,
        enhancedTitle: `${originalTitle} + ${newTitle}`,
        insights: ['Simple merge applied due to processing error'],
        mergeSummary: 'Ideas have been combined using simple merge'
      })
    }

  } catch (error) {
    console.error('Error in smart merge:', error)
    return NextResponse.json({ 
      error: 'Failed to merge ideas',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
