-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable Vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Ideas table
CREATE TABLE public.ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  position_x INTEGER DEFAULT 0,        -- For future spatial organization
  position_y INTEGER DEFAULT 0,        -- For future spatial organization
  priority_order INTEGER DEFAULT 0,    -- For future prioritization
  embedding VECTOR(1536),             -- For semantic search & RAG (dimension for OpenAI ada-002, adjust if using others)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversation Sessions Table (Metadata for a chat session)
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE, -- Optional: if chat is about a specific idea
  title TEXT, -- Optional: A title for the conversation if user names it or AI suggests
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversation Messages Table (Individual messages within a session)
CREATE TABLE public.conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- To ensure user owns the message
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), -- 'user' or 'assistant' (Claude)
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- For semantic search within/across conversations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Ideas policies
CREATE POLICY "Users can view own ideas" ON public.ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ideas" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas" ON public.ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas" ON public.ideas
  FOR DELETE USING (auth.uid() = user_id);

-- Conversations (Sessions) policies
CREATE POLICY "Users can manage own conversation sessions" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- Conversation Messages policies
CREATE POLICY "Users can manage own conversation messages" ON public.conversation_messages
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Indexes for vector columns (example using HNSW, choose appropriate for your workload)
-- Supabase often creates a default GIN index if pgvector is enabled, 
-- but specific index types like HNSW or IVFFlat can offer better performance for cosine similarity.
-- Check Supabase docs for their recommended way to create vector indexes.
-- This is a placeholder, actual index creation might need to be done via Supabase dashboard or specific SQL commands.

-- Example HNSW index for ideas (adjust parameters as needed):
-- CREATE INDEX ON public.ideas USING hnsw (embedding vector_cosine_ops) 
-- WITH (m = 16, ef_construction = 64);

-- Example HNSW index for conversation_messages:
-- CREATE INDEX ON public.conversation_messages USING hnsw (embedding vector_cosine_ops) 
-- WITH (m = 16, ef_construction = 64);

-- Function for semantic search on ideas (example)
CREATE OR REPLACE FUNCTION match_ideas (query_embedding vector(1536), match_threshold float, match_count int)
RETURNS TABLE (id uuid, title text, content text, category text, similarity float)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.content,
    i.category,
    1 - (i.embedding <=> query_embedding) AS similarity -- Cosine similarity
  FROM public.ideas AS i
  WHERE 1 - (i.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function for semantic search on conversation messages (example)
CREATE OR REPLACE FUNCTION match_conversation_messages (query_embedding vector(1536), user_id_filter uuid, match_threshold float, match_count int)
RETURNS TABLE (id uuid, conversation_id uuid, role text, content text, created_at timestamptz, similarity float)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.conversation_id,
    cm.role,
    cm.content,
    cm.created_at,
    1 - (cm.embedding <=> query_embedding) AS similarity
  FROM public.conversation_messages AS cm
  WHERE cm.user_id = user_id_filter AND 1 - (cm.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- The old 'conversations' table schema was for individual messages.
-- We are renaming it to avoid conflict if it exists, and then creating the new structure.
-- This is a migration step. If running for the first time, the ALTER TABLE will harmlessly fail.
ALTER TABLE IF EXISTS public.conversations RENAME TO old_conversations_messages;

-- Check if RLS policies exist for the ideas table
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ideas'; 