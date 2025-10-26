-- ============================================================================
-- Verify Storage Policies (checking the correct columns!)
-- ============================================================================
-- For INSERT policies, check 'with_check' column, not 'qual'
-- qual = USING clause (for SELECT/UPDATE/DELETE)
-- with_check = WITH CHECK clause (for INSERT/UPDATE)

SELECT
  policyname,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
AND (
  policyname LIKE '%split-receipts%'
  OR policyname LIKE '%Users can%'
  OR policyname LIKE '%Public read%'
)
ORDER BY cmd, policyname;
