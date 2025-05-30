-- Enhanced logging tables for development debugging
-- Add to your Supabase SQL editor

-- Development logs table
CREATE TABLE IF NOT EXISTS dev_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  user_id UUID REFERENCES profiles(id),
  conversation_id UUID REFERENCES conversations(id),
  session_id TEXT,
  url TEXT,
  user_agent TEXT
);

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_dev_logs_level ON dev_logs(level);
CREATE INDEX IF NOT EXISTS idx_dev_logs_component ON dev_logs(component);
CREATE INDEX IF NOT EXISTS idx_dev_logs_created_at ON dev_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_logs_user_id ON dev_logs(user_id);

-- Auto-cleanup old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_dev_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM dev_logs 
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
-- Note: You'll need to set up a cron job or use Supabase Edge Functions for this

-- RLS policies for dev_logs
ALTER TABLE dev_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own logs
CREATE POLICY "Users can insert their own dev logs" ON dev_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to view their own logs
CREATE POLICY "Users can view their own dev logs" ON dev_logs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Function to log events easily
CREATE OR REPLACE FUNCTION log_dev_event(
  p_level TEXT,
  p_component TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO dev_logs (level, component, message, data, user_id, conversation_id)
  VALUES (p_level, p_component, p_message, p_data, auth.uid(), p_conversation_id)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
