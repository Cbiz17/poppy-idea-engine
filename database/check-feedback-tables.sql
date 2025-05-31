-- Check and ensure feedback tables exist
-- Run this in Supabase to make sure all feedback functionality works

-- Check if message_feedback table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_feedback') THEN
        -- Create the message_feedback table
        CREATE TABLE public.message_feedback (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
          message_id UUID REFERENCES public.conversation_messages(id) ON DELETE CASCADE NOT NULL,
          feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'rating', 'explicit')),
          feedback_value INTEGER,
          feedback_text TEXT,
          context_tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Enable RLS
        ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

        -- Create policy
        CREATE POLICY "Users can manage own feedback" ON public.message_feedback
          FOR ALL USING (auth.uid() = user_id);

        -- Create indexes
        CREATE INDEX idx_message_feedback_user_id ON public.message_feedback(user_id);
        CREATE INDEX idx_message_feedback_message_id ON public.message_feedback(message_id);
        
        RAISE NOTICE 'Created message_feedback table';
    ELSE
        RAISE NOTICE 'message_feedback table already exists';
    END IF;
END $$;

-- Check if learning_patterns table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'learning_patterns') THEN
        -- Create the learning_patterns table
        CREATE TABLE public.learning_patterns (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          pattern_type TEXT NOT NULL,
          pattern_name TEXT NOT NULL,
          pattern_description TEXT NOT NULL,
          success_metrics JSONB NOT NULL,
          example_conversations UUID[],
          confidence_score FLOAT NOT NULL DEFAULT 0.5,
          usage_count INTEGER DEFAULT 0,
          success_rate FLOAT DEFAULT 0.0,
          embedding VECTOR(1536),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Enable RLS
        ALTER TABLE public.learning_patterns ENABLE ROW LEVEL SECURITY;

        -- Create policy
        CREATE POLICY "Anyone can read learning patterns" ON public.learning_patterns
          FOR SELECT USING (true);

        -- Create index
        CREATE INDEX idx_learning_patterns_type ON public.learning_patterns(pattern_type);
        
        RAISE NOTICE 'Created learning_patterns table';
    ELSE
        RAISE NOTICE 'learning_patterns table already exists';
    END IF;
END $$;

-- Test query to verify tables
SELECT 
    'message_feedback' as table_name,
    COUNT(*) as row_count
FROM public.message_feedback
UNION ALL
SELECT 
    'learning_patterns' as table_name,
    COUNT(*) as row_count
FROM public.learning_patterns;
