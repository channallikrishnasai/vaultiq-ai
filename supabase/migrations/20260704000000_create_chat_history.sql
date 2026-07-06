-- Chat history table for storing AI conversation sessions
-- Each row represents one complete chat session with all messages as JSON
-- Auth is handled by NextAuth via API routes, not Supabase Auth.

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  summary TEXT DEFAULT '',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session ON chat_history(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_created ON chat_history(user_id, created_at DESC);

-- Unique constraint: one row per user per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_history_user_session_unique ON chat_history(user_id, session_id);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_chat_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chat_history_updated_at ON chat_history;
CREATE TRIGGER trigger_chat_history_updated_at
  BEFORE UPDATE ON chat_history
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_history_updated_at();

-- RLS disabled: auth is handled by NextAuth in API routes.
-- The /api/chat-history route filters by user_id after verifying the NextAuth session.
ALTER TABLE chat_history DISABLE ROW LEVEL SECURITY;
