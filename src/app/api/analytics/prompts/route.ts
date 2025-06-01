import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d';
    const promptId = searchParams.get('promptId');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(endDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        startDate.setFullYear(2024); // All time
    }
    
    // Get active prompt if no specific promptId provided
    let targetPromptId = promptId;
    if (!targetPromptId) {
      const { data: activePrompt } = await supabase
        .from('dynamic_prompts')
        .select('id')
        .eq('is_active', true)
        .eq('prompt_type', 'system_message')
        .single();
      
      targetPromptId = activePrompt?.id;
    }
    
    if (!targetPromptId) {
      return NextResponse.json({ error: 'No prompt found' }, { status: 404 });
    }
    
    // Get performance metrics
    const { data: metrics } = await supabase
      .rpc('get_prompt_performance_metrics', {
        p_prompt_id: targetPromptId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });
    
    // Get daily metrics for chart
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
    const { data: dailyMetrics } = await supabase
      .rpc('get_prompt_daily_metrics', {
        p_prompt_id: targetPromptId,
        p_days: days
      });
    
    // Get top feedback tags
    const { data: topTags } = await supabase
      .rpc('get_top_feedback_tags', {
        p_prompt_id: targetPromptId,
        p_limit: 5
      });
    
    // Get comparison data (all prompts)
    const { data: allPrompts } = await supabase
      .from('dynamic_prompts')
      .select('id, prompt_version, is_active, performance_metrics, created_at')
      .eq('prompt_type', 'system_message')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Calculate trend by comparing to previous period
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setTime(prevStartDate.getTime() - (endDate.getTime() - startDate.getTime()));
    
    const { data: prevMetrics } = await supabase
      .rpc('get_prompt_performance_metrics', {
        p_prompt_id: targetPromptId,
        p_start_date: prevStartDate.toISOString(),
        p_end_date: prevEndDate.toISOString()
      });
    
    // Calculate trend
    let trend = 'stable';
    let trendPercentage = 0;
    
    if (metrics?.[0] && prevMetrics?.[0]) {
      const currentRate = metrics[0].positive_count / Math.max(metrics[0].total_interactions, 1);
      const prevRate = prevMetrics[0].positive_count / Math.max(prevMetrics[0].total_interactions, 1);
      
      if (prevRate > 0) {
        trendPercentage = ((currentRate - prevRate) / prevRate) * 100;
        trend = trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';
      }
    }
    
    return NextResponse.json({
      metrics: metrics?.[0] || {},
      dailyMetrics: dailyMetrics || [],
      topTags: topTags || [],
      comparison: allPrompts || [],
      trend: {
        direction: trend,
        percentage: Math.abs(trendPercentage)
      }
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}