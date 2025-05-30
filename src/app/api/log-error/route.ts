import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const { error, stack, componentStack, url, userAgent } = await req.json();
    
    const supabase = await createServerSupabaseClient();
    
    // Try to get user info (might be null if auth error)
    const { data: { user } } = await supabase.auth.getUser();

    // Log to dev_logs table
    const { error: logError } = await supabase
      .from('dev_logs')
      .insert({
        level: 'error',
        component: 'client-error',
        message: error,
        data: {
          stack,
          componentStack,
          timestamp: new Date().toISOString(),
        },
        user_id: user?.id,
        url,
        user_agent: userAgent,
      });

    if (logError) {
      console.error('Failed to log error to database:', logError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in log-error endpoint:', err);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
