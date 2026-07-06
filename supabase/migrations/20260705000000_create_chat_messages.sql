-- chat_messages: individual messages per conversation
-- Auth is handled by NextAuth via API routes, not Supabase Auth.

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_conversation ON chat_messages(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);

-- RLS disabled: auth is handled by NextAuth in API routes.
-- The /api/chat-messages route filters by user_id after verifying the NextAuth session.
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
