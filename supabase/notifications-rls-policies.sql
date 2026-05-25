-- Notifications RLS policies.
-- Applied via mcp__supabase__apply_migration as `notifications_rls_policies`.
--
-- Bug fix: RLS was enabled on public.notifications with NO policies, which
-- silently denies all writes. Friends inserting notification rows for each
-- other (e.g., notifySplitCreated called when sending a payment request)
-- were blocked at the DB level. The .catch in notificationService swallowed
-- the error, so no row was ever created and no push fired.

CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- Follow-up fix (May 25 2026): supabase-js `.insert().select()` forces a
-- RETURNING clause, and Postgres re-applies the SELECT policy to the new
-- row. The old SELECT policy (`user_id = auth.uid()`) rejected reads-back
-- for peer notifications (vicky inserting for michael), failing the whole
-- INSERT. Fix: track the inserter and let them read back their own writes.
-- Applied via mcp__supabase__apply_migration as `notifications_inserter_select`.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES public.profiles(id);

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;

CREATE POLICY "notifications_select_own_or_inserter"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (created_by IS NOT NULL AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS notifications_insert_authenticated ON public.notifications;

CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (created_by = auth.uid() AND auth.uid() IS NOT NULL)
  );
