-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: set the current user ID as a session variable (fallback)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_current_user_id(uid TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', uid, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants: ensure PostgREST's "authenticated" role has table access
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- chat_messages  (individual messages)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_messages_select_own
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY chat_messages_insert_own
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY chat_messages_update_own
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY chat_messages_delete_own
  ON public.chat_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- ─────────────────────────────────────────────────────────────────────────────
-- chat_history  (JSONB sessions)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_history_select_own
  ON public.chat_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY chat_history_insert_own
  ON public.chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY chat_history_update_own
  ON public.chat_history
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY chat_history_delete_own
  ON public.chat_history
  FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');
