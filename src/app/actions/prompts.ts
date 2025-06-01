'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function insertDynamicPrompt(promptData: {
  prompt_type: string;
  prompt_content: string;
  prompt_version: number;
  performance_metrics: any;
  a_b_test_group: string;
  is_active: boolean;
}) {
  try {
    // Create a Supabase client with proper auth context
    const supabase = await createServerSupabaseClient();
    
    // First check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }
    
    // Try to insert with current user context
    const { data, error } = await supabase
      .from('dynamic_prompts')
      .insert(promptData)
      .select()
      .single();
      
    if (error) {
      console.error('Insert error:', error);
      
      // If it's a permissions error, we need to add the user_id to the prompt data
      // Some tables require user_id for RLS policies
      if (error.code === '42501') { // PostgreSQL insufficient privilege error
        // Try with user_id added
        const { data: retryData, error: retryError } = await supabase
          .from('dynamic_prompts')
          .insert({
            ...promptData,
            user_id: user.id // Add user_id if the table has this column
          })
          .select()
          .single();
          
        if (retryError) {
          throw retryError;
        }
        
        return retryData;
      }
      
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Server action error:', error);
    throw error;
  }
}
