import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import * as Sentry from '@sentry/nextjs';

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  details?: any;
}

export async function GET() {
  const timestamp = new Date().toISOString();
  
  // Initialize service statuses
  const services: Record<string, ServiceStatus> = {
    database: { status: 'unhealthy', message: 'Not checked', timestamp },
    auth: { status: 'unhealthy', message: 'Not checked', timestamp },
    ai: { status: 'unhealthy', message: 'Not checked', timestamp },
    embeddings: { status: 'unhealthy', message: 'Not checked', timestamp },
    storage: { status: 'unhealthy', message: 'Not checked', timestamp },
    sentry: { status: 'unhealthy', message: 'Not checked', timestamp }
  };

  // Initialize metrics
  const metrics = {
    activeUsers: 0,
    conversationsToday: 0,
    ideasSaved: 0,
    feedbackCollected: 0,
    averageResponseTime: 0
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  const errors: string[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. Check Database
    try {
      const startTime = Date.now();
      const { error: dbError, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (!dbError) {
        services.database = {
          status: responseTime < 1000 ? 'healthy' : 'degraded',
          message: `Connected (${responseTime}ms)`,
          timestamp,
          details: { responseTime }
        };
      } else {
        services.database = {
          status: 'unhealthy',
          message: dbError.message,
          timestamp
        };
        overallStatus = 'degraded';
      }
    } catch (e) {
      services.database = {
        status: 'unhealthy',
        message: 'Connection failed',
        timestamp
      };
      overallStatus = 'degraded';
    }

    // 2. Check Auth
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      services.auth = {
        status: authError ? 'degraded' : 'healthy',
        message: authError ? 'No authenticated user' : 'Authentication working',
        timestamp,
        details: { hasUser: !!user }
      };
    } catch (e) {
      services.auth = {
        status: 'unhealthy',
        message: 'Auth service error',
        timestamp
      };
      overallStatus = 'degraded';
    }

    // 3. Check AI (Anthropic)
    if (process.env.ANTHROPIC_API_KEY) {
      services.ai = {
        status: 'healthy',
        message: 'API key configured',
        timestamp,
        details: { 
          model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
          keyLength: process.env.ANTHROPIC_API_KEY.length 
        }
      };
    } else {
      services.ai = {
        status: 'unhealthy',
        message: 'API key not configured',
        timestamp
      };
      overallStatus = 'unhealthy';
    }

    // 4. Check Embeddings (OpenAI)
    if (process.env.OPENAI_API_KEY) {
      services.embeddings = {
        status: 'healthy',
        message: 'API key configured',
        timestamp,
        details: { keyLength: process.env.OPENAI_API_KEY.length }
      };
    } else {
      services.embeddings = {
        status: 'degraded',
        message: 'API key not configured (optional)',
        timestamp
      };
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    // 5. Check Storage (Supabase Storage)
    try {
      // Just verify the storage client can be created
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      services.storage = {
        status: storageError ? 'degraded' : 'healthy',
        message: storageError ? 'Storage access limited' : 'Storage accessible',
        timestamp
      };
    } catch (e) {
      services.storage = {
        status: 'degraded',
        message: 'Storage not configured',
        timestamp
      };
    }

    // 6. Check Sentry
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      services.sentry = {
        status: 'healthy',
        message: 'Error tracking configured',
        timestamp,
        details: { 
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN.substring(0, 30) + '...' 
        }
      };
    } else {
      services.sentry = {
        status: 'degraded',
        message: 'Error tracking not configured',
        timestamp
      };
    }

    // Collect metrics (only if database is healthy)
    if (services.database.status === 'healthy') {
      try {
        // Active users (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: activeUsers } = await supabase
          .from('user_actions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', oneDayAgo);
        
        metrics.activeUsers = activeUsers || 0;

        // Conversations today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: conversationsToday } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString());
        
        metrics.conversationsToday = conversationsToday || 0;

        // Ideas saved today
        const { count: ideasSaved } = await supabase
          .from('ideas')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString());
        
        metrics.ideasSaved = ideasSaved || 0;

        // Feedback collected today
        const { count: feedbackCollected } = await supabase
          .from('message_feedback')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString());
        
        metrics.feedbackCollected = feedbackCollected || 0;

        // Average response time (from database service check)
        metrics.averageResponseTime = services.database.details?.responseTime || 0;
        
      } catch (e) {
        console.error('Error collecting metrics:', e);
      }
    }

    // Determine overall status
    const serviceStatuses = Object.values(services).map(s => s.status);
    if (serviceStatuses.every(s => s === 'healthy')) {
      overallStatus = 'healthy';
    } else if (serviceStatuses.some(s => s === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    const response = {
      overall: {
        status: overallStatus,
        message: overallStatus === 'healthy' 
          ? 'All systems operational' 
          : overallStatus === 'degraded'
          ? 'Some services are degraded'
          : 'System experiencing issues',
        timestamp
      },
      services,
      metrics
    };

    return NextResponse.json(response, {
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    Sentry.captureException(error);
    
    return NextResponse.json({
      overall: {
        status: 'unhealthy',
        message: 'Health check failed',
        timestamp,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      services,
      metrics
    }, { status: 503 });
  }
}
