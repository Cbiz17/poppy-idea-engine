// Enhanced Idea Workflow API Routes
// Handles branching, merging, and version visualization

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Create a new branch/version of an idea
export async function POST(req: Request) {
  try {
    const { ideaId, branchName, initialContent } = await req.json()
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current idea
    const { data: currentIdea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .single()

    if (ideaError || !currentIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    // No version_number column exists, so we'll track versions by count

    // Create a new development history entry
    const { data: newHistory, error: historyError } = await supabase
      .from('idea_development_history')
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        previous_version: {
          title: currentIdea.title,
          content: currentIdea.content,
          category: currentIdea.category
        },
        new_version: {
          title: currentIdea.title,
          content: initialContent || currentIdea.content,
          category: currentIdea.category,
          branch_name: branchName
        },
        development_type: 'refinement', // Using valid enum value
        change_summary: `Created new branch: ${branchName}`,
        ai_confidence_score: 1.0
      })
      .select()
      .single()

    if (historyError) {
      console.error('Error creating branch:', historyError)
      return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      branch: newHistory,
      message: `Branch "${branchName}" created successfully`
    })

  } catch (error) {
    console.error('Error in workflow API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Merge branches/versions
export async function PATCH(req: Request) {
  try {
    const { sourceHistoryId, targetIdeaId, mergeStrategy = 'smart' } = await req.json()
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get source history entry
    const { data: sourceHistory, error: sourceError } = await supabase
      .from('idea_development_history')
      .select('*')
      .eq('id', sourceHistoryId)
      .single()

    if (sourceError || !sourceHistory) {
      return NextResponse.json({ error: 'Source version not found' }, { status: 404 })
    }

    // Get target idea
    const { data: targetIdea, error: targetError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', targetIdeaId)
      .eq('user_id', user.id)
      .single()

    if (targetError || !targetIdea) {
      return NextResponse.json({ error: 'Target idea not found' }, { status: 404 })
    }

    let mergedContent = targetIdea.content
    let mergeMetadata = {}

    if (mergeStrategy === 'smart') {
      // Call AI service for intelligent merging
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/smart-merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalContent: targetIdea.content,
            newContent: sourceHistory.new_content,
            mergeType: 'branch_merge'
          })
        })

        if (response.ok) {
          const { mergedContent: smartMerged, insights } = await response.json()
          mergedContent = smartMerged
          mergeMetadata = { insights, strategy: 'ai_assisted' }
        }
      } catch (error) {
        console.error('Smart merge failed, falling back to append:', error)
        mergedContent = `${targetIdea.content}\n\n--- Merged from ${sourceHistory.branch_name || 'branch'} ---\n${sourceHistory.new_content}`
        mergeMetadata = { strategy: 'append_fallback' }
      }
    } else {
      // Simple append merge
      mergedContent = `${targetIdea.content}\n\n--- Merged from ${sourceHistory.branch_name || 'branch'} ---\n${sourceHistory.new_content}`
      mergeMetadata = { strategy: 'append' }
    }

    // Update the target idea
    const { error: updateError } = await supabase
      .from('ideas')
      .update({
        content: mergedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetIdeaId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 })
    }

    // Record the merge in history
    const { data: mergeHistory, error: mergeHistoryError } = await supabase
      .from('idea_development_history')
      .insert({
        idea_id: targetIdeaId,
        user_id: user.id,
        previous_version: {
          title: targetIdea.title,
          content: targetIdea.content,
          category: targetIdea.category
        },
        new_version: {
          title: targetIdea.title,
          content: mergedContent,
          category: targetIdea.category,
          merge_source_id: sourceHistoryId,
          merge_metadata: mergeMetadata
        },
        development_type: 'merge',
        change_summary: `Merged branch "${sourceHistory.new_version?.branch_name || 'unnamed'}" into main`,
        ai_confidence_score: 0.9
      })
      .select()
      .single()

    if (mergeHistoryError) {
      console.error('Error recording merge:', mergeHistoryError)
    }

    return NextResponse.json({ 
      success: true, 
      mergedIdea: { ...targetIdea, content: mergedContent },
      mergeHistory,
      message: 'Branches merged successfully'
    })

  } catch (error) {
    console.error('Error in merge API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get workflow visualization data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ideaId = searchParams.get('ideaId')
    
    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get complete history tree
    const { data: historyTree, error: treeError } = await supabase
      .rpc('get_idea_history_tree', { p_idea_id: ideaId })

    if (treeError) {
      console.error('Error fetching history tree:', treeError)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    // Get idea stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_idea_stats', { p_user_id: user.id })

    if (statsError) {
      console.error('Error fetching stats:', statsError)
    }

    // Get related conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      historyTree: historyTree || [],
      stats: stats?.[0] || {},
      conversations: conversations || [],
      visualization: {
        nodes: transformToNodes(historyTree || []),
        links: transformToLinks(historyTree || [])
      }
    })

  } catch (error) {
    console.error('Error in workflow GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions for visualization
interface HistoryTreeItem {
  history_id: string;
  change_summary?: string;
  development_type: string;
  branch_name?: string;
  depth: number;
  created_at: string;
  version_number?: number;
  parent_id?: string;
}

function transformToNodes(historyTree: HistoryTreeItem[]) {
  return historyTree.map(item => ({
    id: item.history_id,
    label: item.change_summary || 'Development',
    type: item.development_type,
    branch: item.branch_name,
    depth: item.depth,
    date: item.created_at,
    version: item.version_number || 0
  }))
}

function transformToLinks(historyTree: HistoryTreeItem[]) {
  return historyTree
    .filter(item => item.parent_id)
    .map(item => ({
      source: item.parent_id,
      target: item.history_id,
      type: 'development'
    }))
}