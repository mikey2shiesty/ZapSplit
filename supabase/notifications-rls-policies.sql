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
