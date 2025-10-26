-- ============================================================================
-- Fix the INSERT policy for split-receipts bucket
-- ============================================================================
-- The initial policy was created but the WITH CHECK condition is null
-- This script drops and recreates it with the proper security check

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'split-receipts'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Verify the fix
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname = 'Users can upload to own folder';
