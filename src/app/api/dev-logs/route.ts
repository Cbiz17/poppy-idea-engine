import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const { logs } = await req.json();
    
    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json({ error: 'Invalid logs payload' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    
    // Get current user (optional - logs can be anonymous)
    const { data: { user } } = await supabase.auth.getUser();

    // Transform logs for database insertion
    const dbLogs = logs.map(log => ({
      level: log.level,
      component: log.component,
      message: log.message,
      data: log.data || null,
      user_id: user?.id || null,
      conversation_id: log.conversationId || null,
      session_id: log.sessionId || null,
      url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }));

    // Batch insert logs
    const { error } = await supabase
      .from('dev_logs')
      .insert(dbLogs);

    if (error) {
      console.error('Error inserting dev logs:', error);
      return NextResponse.json({ error: 'Failed to store logs' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: logs.length });
  } catch (error) {
    console.error('Dev logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const level = searchParams.get('level');
    const component = searchParams.get('component');
    
    const supabase = await createServerSupabaseClient();
    
    let query = supabase
      .from('dev_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (level && level !== 'all') {
      query = query.eq('level', level);
    }
    
    if (component) {
      query = query.ilike('component', `%${component}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching dev logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
    
    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    console.error('Dev logs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
