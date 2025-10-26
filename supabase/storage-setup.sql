-- ============================================================================
-- Supabase Storage Setup for ZapSplit
-- ============================================================================
-- This script creates the storage bucket and RLS policies for receipt images.
-- Run this in the Supabase SQL Editor or use the Dashboard (see SUPABASE_STORAGE_SETUP.md)

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Create the 'split-receipts' bucket
-- This bucket stores all receipt images (AI-scanned and manual uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'split-receipts',                                    -- Bucket ID
  'split-receipts',                                    -- Bucket name
  true,                                                -- Public bucket (receipts are shareable)
  5242880,                                             -- 5 MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']       -- Allowed MIME types
)
ON CONFLICT (id) DO NOTHING;  -- Skip if bucket already exists

-- ============================================================================
-- 2. CREATE RLS POLICIES
-- ============================================================================

-- Policy 1: Allow users to upload to their own folder
-- Users can only upload files to folders named with their user ID
-- Example: user 'abc-123' can upload to 'abc-123/receipts/12345.jpg'
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'split-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow public read access for receipts
-- Anyone with the URL can view receipts (needed for split sharing)
-- This allows split participants to see the receipt image
CREATE POLICY "Public read access for receipts"
ON storage.objects
FOR SELECT
TO public, authenticated
USING (
  bucket_id = 'split-receipts'
);

-- Policy 3: Allow users to delete their own files
-- Users can only delete files in their own folder
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'split-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- 3. VERIFY SETUP (Optional)
-- ============================================================================

-- Check that the bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'split-receipts';

-- Check that policies were created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%split-receipts%'
OR policyname LIKE '%Users can%'
OR policyname LIKE '%Public read%';

-- ============================================================================
-- CLEANUP (Only if you need to start over)
-- ============================================================================

-- WARNING: This will delete the bucket and all policies!
-- Uncomment and run these lines ONLY if you need to reset:

-- DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
-- DROP POLICY IF EXISTS "Public read access for receipts" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'split-receipts';
