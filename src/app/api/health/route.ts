import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      api: true,
      database: false,
      auth: false,
      anthropic: false,
    },
    errors: [] as string[],
  };

  try {
    // Check database connection
    const supabase = await createServerSupabaseClient();
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (!dbError) {
      health.checks.database = true;
    } else {
      health.errors.push(`Database: ${dbError.message}`);
    }

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError) {
      health.checks.auth = true;
    } else {
      health.errors.push(`Auth: ${authError.message}`);
    }

    // Check Anthropic API key
    if (process.env.ANTHROPIC_API_KEY) {
      health.checks.anthropic = true;
    } else {
      health.errors.push('Anthropic API key not configured');
    }

    // Overall status
    const allChecks = Object.values(health.checks);
    if (allChecks.every(check => check === true)) {
      health.status = 'healthy';
    } else if (allChecks.some(check => check === true)) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }

    return NextResponse.json(health, {
      status: health.status === 'unhealthy' ? 503 : 200,
    });
  } catch (error) {
    health.status = 'error';
    health.errors.push(`Unexpected error: ${String(error)}`);
    
    return NextResponse.json(health, { status: 503 });
  }
}
