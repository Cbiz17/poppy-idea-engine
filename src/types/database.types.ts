export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ab_test_results: {
        Row: {
          id: string
          test_id: string
          user_id: string
          variant_group: 'control' | 'variant'
          metric_type: string
          metric_value: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          user_id: string
          variant_group: 'control' | 'variant'
          metric_type: string
          metric_value: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          user_id?: string
          variant_group?: 'control' | 'variant'
          metric_type?: string
          metric_value?: number
          metadata?: Json | null
          created_at?: string
        }
      }
      ab_tests: {
        Row: {
          id: string
          test_name: string
          test_type: string
          variants: Json
          start_date: string
          end_date: string | null
          is_active: boolean
          success_metrics: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_name: string
          test_type: string
          variants: Json
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          success_metrics: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_name?: string
          test_type?: string
          variants?: Json
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          success_metrics?: Json
          created_at?: string
          updated_at?: string
        }
      }
      conversation_continuity: {
        Row: {
          id: string
          user_id: string
          parent_conversation_id: string
          child_conversation_id: string
          continuity_type: 'idea_development' | 'topic_exploration' | 'problem_solving'
          shared_context: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_conversation_id: string
          child_conversation_id: string
          continuity_type: 'idea_development' | 'topic_exploration' | 'problem_solving'
          shared_context: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_conversation_id?: string
          child_conversation_id?: string
          continuity_type?: 'idea_development' | 'topic_exploration' | 'problem_solving'
          shared_context?: Json
          created_at?: string
        }
      }
      conversation_messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          embedding: number[] | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
        }
      }
      conversation_outcomes: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          outcome_type: 'idea_saved' | 'problem_solved' | 'exploration_completed' | 'abandoned'
          satisfaction_score: number | null
          outcome_metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          outcome_type: 'idea_saved' | 'problem_solved' | 'exploration_completed' | 'abandoned'
          satisfaction_score?: number | null
          outcome_metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          outcome_type?: 'idea_saved' | 'problem_solved' | 'exploration_completed' | 'abandoned'
          satisfaction_score?: number | null
          outcome_metadata?: Json | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          summary: string | null
          idea_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          summary?: string | null
          idea_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          summary?: string | null
          idea_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_feedback_streaks: {
        Row: {
          id: string
          user_id: string
          date: string
          feedback_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          feedback_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          feedback_count?: number
          created_at?: string
        }
      }
      dev_logs: {
        Row: {
          id: string
          level: 'info' | 'warn' | 'error' | 'debug'
          component: string
          message: string
          data: Json | null
          user_id: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          level: 'info' | 'warn' | 'error' | 'debug'
          component: string
          message: string
          data?: Json | null
          user_id?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          level?: 'info' | 'warn' | 'error' | 'debug'
          component?: string
          message?: string
          data?: Json | null
          user_id?: string | null
          session_id?: string | null
          created_at?: string
        }
      }
      dynamic_prompts: {
        Row: {
          id: string
          prompt_type: string
          prompt_content: string
          prompt_version: number
          performance_metrics: Json | null
          a_b_test_group: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prompt_type: string
          prompt_content: string
          prompt_version: number
          performance_metrics?: Json | null
          a_b_test_group?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prompt_type?: string
          prompt_content?: string
          prompt_version?: number
          performance_metrics?: Json | null
          a_b_test_group?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      feedback_rewards: {
        Row: {
          id: string
          user_id: string
          reward_type: 'badge' | 'milestone' | 'streak'
          reward_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reward_type: 'badge' | 'milestone' | 'streak'
          reward_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reward_type?: 'badge' | 'milestone' | 'streak'
          reward_data?: Json
          created_at?: string
        }
      }
      idea_comments: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      idea_contributors: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          contribution_type: 'creator' | 'collaborator' | 'commenter'
          added_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          contribution_type: 'creator' | 'collaborator' | 'commenter'
          added_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          contribution_type?: 'creator' | 'collaborator' | 'commenter'
          added_at?: string
        }
      }
      idea_development_history: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          conversation_id: string | null
          development_type: 'refinement' | 'expansion' | 'pivot' | 'merge' | 'major_revision'
          previous_version: Json
          new_version: Json
          ai_confidence_score: number | null
          change_summary: string
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          conversation_id?: string | null
          development_type: 'refinement' | 'expansion' | 'pivot' | 'merge' | 'major_revision'
          previous_version: Json
          new_version: Json
          ai_confidence_score?: number | null
          change_summary: string
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          conversation_id?: string | null
          development_type?: 'refinement' | 'expansion' | 'pivot' | 'merge' | 'major_revision'
          previous_version?: Json
          new_version?: Json
          ai_confidence_score?: number | null
          change_summary?: string
          created_at?: string
        }
      }
      idea_discovery_stats: {
        Row: {
          id: string
          idea_id: string
          view_count: number
          like_count: number
          comment_count: number
          remix_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          view_count?: number
          like_count?: number
          comment_count?: number
          remix_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          view_count?: number
          like_count?: number
          comment_count?: number
          remix_count?: number
          updated_at?: string
        }
      }
      idea_likes: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          created_at?: string
        }
      }
      idea_remixes: {
        Row: {
          id: string
          original_idea_id: string
          remix_idea_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          original_idea_id: string
          remix_idea_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          original_idea_id?: string
          remix_idea_id?: string
          user_id?: string
          created_at?: string
        }
      }
      idea_shares: {
        Row: {
          id: string
          idea_id: string
          shared_by: string
          share_type: 'link' | 'email' | 'social'
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          shared_by: string
          share_type: 'link' | 'email' | 'social'
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          shared_by?: string
          share_type?: 'link' | 'email' | 'social'
          created_at?: string
        }
      }
      idea_version_timeline: {
        Row: {
          id: string
          idea_id: string
          version_number: number
          title: string
          content: string
          category: string
          change_type: 'created' | 'updated' | 'merged' | 'branched'
          change_description: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          idea_id: string
          version_number: number
          title: string
          content: string
          category: string
          change_type: 'created' | 'updated' | 'merged' | 'branched'
          change_description?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          idea_id?: string
          version_number?: number
          title?: string
          content?: string
          category?: string
          change_type?: 'created' | 'updated' | 'merged' | 'branched'
          change_description?: string | null
          created_at?: string
          created_by?: string
        }
      }
      ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: string
          tags: string[] | null
          metadata: Json | null
          embedding: number[] | null
          is_public: boolean
          branched_from_id: string | null
          development_stage: 'initial' | 'developing' | 'refined' | 'completed'
          development_count: number
          ai_generated_summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          category: string
          tags?: string[] | null
          metadata?: Json | null
          embedding?: number[] | null
          is_public?: boolean
          branched_from_id?: string | null
          development_stage?: 'initial' | 'developing' | 'refined' | 'completed'
          development_count?: number
          ai_generated_summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          category?: string
          tags?: string[] | null
          metadata?: Json | null
          embedding?: number[] | null
          is_public?: boolean
          branched_from_id?: string | null
          development_stage?: 'initial' | 'developing' | 'refined' | 'completed'
          development_count?: number
          ai_generated_summary?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      learning_patterns: {
        Row: {
          id: string
          pattern_type: string
          pattern_name: string
          pattern_description: string
          success_metrics: Json
          confidence_score: number
          usage_count: number
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pattern_type: string
          pattern_name: string
          pattern_description: string
          success_metrics: Json
          confidence_score: number
          usage_count?: number
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pattern_type?: string
          pattern_name?: string
          pattern_description?: string
          success_metrics?: Json
          confidence_score?: number
          usage_count?: number
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
      message_feedback: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          message_id: string
          feedback_type: 'thumbs_up' | 'thumbs_down' | 'rating' | 'tag'
          feedback_value: number | null
          feedback_text: string | null
          context_tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id: string
          message_id: string
          feedback_type: 'thumbs_up' | 'thumbs_down' | 'rating' | 'tag'
          feedback_value?: number | null
          feedback_text?: string | null
          context_tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          message_id?: string
          feedback_type?: 'thumbs_up' | 'thumbs_down' | 'rating' | 'tag'
          feedback_value?: number | null
          feedback_text?: string | null
          context_tags?: string[] | null
          created_at?: string
        }
      }
      old_conversations_backup: {
        Row: {
          id: string
          user_id: string
          messages: Json
          created_at: string
          summary: string | null
        }
        Insert: {
          id?: string
          user_id: string
          messages: Json
          created_at?: string
          summary?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          messages?: Json
          created_at?: string
          summary?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          preferences: Json | null
          onboarding_completed: boolean
          onboarding_step: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferences?: Json | null
          onboarding_completed?: boolean
          onboarding_step?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferences?: Json | null
          onboarding_completed?: boolean
          onboarding_step?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      smart_save_suggestions: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          suggested_at_message_count: number
          suggestion_reason: string
          was_accepted: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          suggested_at_message_count: number
          suggestion_reason: string
          was_accepted?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          suggested_at_message_count?: number
          suggestion_reason?: string
          was_accepted?: boolean | null
          created_at?: string
        }
      }
      user_ab_preferences: {
        Row: {
          id: string
          user_id: string
          preference_type: string
          preference_value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preference_type: string
          preference_value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preference_type?: string
          preference_value?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_data: Json
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_data: Json
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_data?: Json
          unlocked_at?: string
        }
      }
      user_actions: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          idea_id: string | null
          action_type: string
          action_context: Json | null
          action_metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id?: string | null
          idea_id?: string | null
          action_type: string
          action_context?: Json | null
          action_metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string | null
          idea_id?: string | null
          action_type?: string
          action_context?: Json | null
          action_metadata?: Json | null
          created_at?: string
        }
      }
      user_test_assignments: {
        Row: {
          id: string
          user_id: string
          test_id: string
          variant_group: 'control' | 'variant'
          assigned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          test_id: string
          variant_group: 'control' | 'variant'
          assigned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          test_id?: string
          variant_group?: 'control' | 'variant'
          assigned_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_conversation_patterns: {
        Args: { p_user_id?: string }
        Returns: {
          pattern_type: string
          pattern_count: number
          avg_satisfaction: number
          common_tags: string[]
        }[]
      }
      get_dynamic_system_prompt: {
        Args: { p_user_id?: string }
        Returns: string
      }
      get_user_feedback_gamification_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_test_variant: {
        Args: {
          p_user_id: string
          p_test_type: string
        }
        Returns: {
          test_id: string
          variant_group: string
        }[]
      }
      match_conversation_messages: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          user_id: string
        }
        Returns: {
          id: string
          content: string
          role: string
          conversation_id: string
          similarity: number
        }[]
      }
      match_ideas: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          filter_user_id?: string
        }
        Returns: {
          id: string
          title: string
          content: string
          category: string
          user_id: string
          similarity: number
        }[]
      }
      match_learning_patterns: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          pattern_type: string
          pattern_name: string
          pattern_description: string
          confidence_score: number
          usage_count: number
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
