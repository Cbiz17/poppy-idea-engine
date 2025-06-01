import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'create-test':
        return await createABTest(supabase, user.id, body);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in A/B tests API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function createABTest(supabase: any, userId: string, body: any) {
  try {
    const { controlPromptId, variantPromptId, testName, testDescription, trafficSplit, duration, successMetric, minimumSampleSize } = body;

    // Create the A/B test
    const { data: newTest, error } = await supabase
      .from('ab_tests')
      .insert({
        test_name: testName,
        test_description: testDescription,
        test_type: 'prompt_variation',
        variants: {
          control: { prompt_id: controlPromptId, name: 'Current Version' },
          variant: { prompt_id: variantPromptId, name: 'New Version' }
        },
        success_metric: successMetric,
        target_sample_size: minimumSampleSize,
        current_sample_size: 0,
        is_active: true,
        test_status: 'running',
        test_config: {
          traffic_split: trafficSplit,
          minimum_sample_size: minimumSampleSize,
          confidence_level: 0.95,
          test_duration_days: duration
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating A/B test:', error);
      return NextResponse.json({ 
        error: 'Failed to create A/B test',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      test: newTest
    });

  } catch (error) {
    console.error('Error creating A/B test:', error);
    return NextResponse.json({ 
      error: 'Failed to create test'
    }, { status: 500 });
  }
}
