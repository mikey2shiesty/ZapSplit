-- ============================================================================
-- Verify Receipt Split Data in Supabase
-- ============================================================================
-- Run these queries to verify that receipt scanning and database integration
-- is working correctly. This checks splits, items, assignments, and storage.

-- ============================================================================
-- 1. CHECK SPLITS TABLE
-- ============================================================================
-- Find the most recent receipt split
SELECT
  id,
  title,
  description,
  total_amount,
  currency,
  split_type,
  image_url,
  status,
  created_at,
  creator_id
FROM splits
WHERE split_type = 'receipt'
ORDER BY created_at DESC
LIMIT 5;

-- Get the split ID (replace this with actual ID from above query)
-- Example: SET @split_id = 'your-split-id-here';

-- ============================================================================
-- 2. CHECK SPLIT_ITEMS TABLE
-- ============================================================================
-- Verify all receipt items were saved correctly
-- Replace 'YOUR_SPLIT_ID' with the actual split ID from query 1
SELECT
  id,
  split_id,
  name,
  unit_price,
  quantity,
  total_price,
  created_at
FROM split_items
WHERE split_id = 'YOUR_SPLIT_ID'
ORDER BY created_at;

-- Verify totals match
SELECT
  COUNT(*) as item_count,
  SUM(total_price) as receipt_subtotal
FROM split_items
WHERE split_id = 'YOUR_SPLIT_ID';

-- ============================================================================
-- 3. CHECK ITEM_ASSIGNMENTS TABLE
-- ============================================================================
-- Verify user's item assignments were saved
-- This should show the 2 items you selected (CHICKEN BURRITO + KIDS MEAL)
SELECT
  ia.id,
  ia.user_id,
  si.name as item_name,
  si.unit_price,
  si.quantity,
  si.total_price,
  ia.share as share_percentage,
  ia.amount as your_amount,
  ia.created_at
FROM item_assignments ia
JOIN split_items si ON ia.item_id = si.id
WHERE si.split_id = 'YOUR_SPLIT_ID'
ORDER BY ia.created_at;

-- Calculate your total
SELECT
  user_id,
  COUNT(*) as items_selected,
  SUM(amount) as your_subtotal
FROM item_assignments ia
JOIN split_items si ON ia.item_id = si.id
WHERE si.split_id = 'YOUR_SPLIT_ID'
GROUP BY user_id;

-- ============================================================================
-- 4. CHECK SPLIT_PARTICIPANTS TABLE
-- ============================================================================
-- Verify participant record was created
SELECT
  id,
  split_id,
  user_id,
  amount_owed,
  amount_paid,
  status,
  created_at
FROM split_participants
WHERE split_id = 'YOUR_SPLIT_ID';

-- ============================================================================
-- 5. CHECK STORAGE (Receipt Image)
-- ============================================================================
-- List recent receipt uploads in storage
SELECT
  id,
  name,
  bucket_id,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'split-receipts'
ORDER BY created_at DESC
LIMIT 10;

-- Get the public URL for a receipt (replace FILENAME with actual path)
-- The filename format is: {user_id}/receipts/{timestamp}.jpg
-- You can find it from the image_url in the splits table (query 1)

-- ============================================================================
-- 6. COMPLETE RECEIPT SPLIT SUMMARY
-- ============================================================================
-- Get a complete summary of the most recent receipt split
-- Replace 'YOUR_SPLIT_ID' with actual split ID
SELECT
  s.id as split_id,
  s.title,
  s.description,
  s.total_amount as receipt_total,
  s.split_type,
  s.created_at as split_created,
  (SELECT COUNT(*) FROM split_items WHERE split_id = s.id) as total_items,
  (SELECT COUNT(*) FROM item_assignments ia
   JOIN split_items si ON ia.item_id = si.id
   WHERE si.split_id = s.id) as total_assignments,
  (SELECT SUM(total_price) FROM split_items WHERE split_id = s.id) as items_subtotal,
  s.image_url as receipt_image
FROM splits s
WHERE s.id = 'YOUR_SPLIT_ID';

-- ============================================================================
-- 7. VALIDATE DATA INTEGRITY
-- ============================================================================
-- Check for any orphaned records or data issues

-- Check for items without assignments
SELECT
  si.id,
  si.name,
  si.total_price,
  'No assignments' as issue
FROM split_items si
LEFT JOIN item_assignments ia ON ia.item_id = si.id
WHERE si.split_id = 'YOUR_SPLIT_ID'
AND ia.id IS NULL;

-- Check for assignments with invalid amounts
SELECT
  ia.id,
  si.name,
  ia.share as share_percentage,
  ia.amount,
  si.total_price,
  'Invalid share' as issue
FROM item_assignments ia
JOIN split_items si ON ia.item_id = si.id
WHERE si.split_id = 'YOUR_SPLIT_ID'
AND (ia.amount > si.total_price OR ia.amount < 0);

-- ============================================================================
-- QUICK CHECK (All-in-One)
-- ============================================================================
-- Get the latest split with all related data
WITH latest_split AS (
  SELECT id FROM splits WHERE split_type = 'receipt' ORDER BY created_at DESC LIMIT 1
)
SELECT
  'Split Info' as section,
  s.title as detail,
  s.total_amount::text as value
FROM splits s, latest_split
WHERE s.id = latest_split.id

UNION ALL

SELECT
  'Total Items' as section,
  COUNT(*)::text as detail,
  SUM(total_price)::text as value
FROM split_items, latest_split
WHERE split_id = latest_split.id

UNION ALL

SELECT
  'Your Items' as section,
  COUNT(*)::text as detail,
  SUM(ia.amount)::text as value
FROM item_assignments ia
JOIN split_items si ON ia.item_id = si.id, latest_split
WHERE si.split_id = latest_split.id;

-- ============================================================================
-- EXPECTED RESULTS FOR YOUR TEST
-- ============================================================================
-- Based on the screenshot you showed:
--
-- SPLITS TABLE:
-- - title: Should contain merchant name or "Receipt Split"
-- - total_amount: Should be around $14.54 (your total)
-- - split_type: 'receipt'
-- - image_url: Should contain supabase storage URL
--
-- SPLIT_ITEMS TABLE (4 items):
-- 1. CHICKEN BURRITO - $8.79
-- 2. KIDS MEAL - MAKE OWN - $4.99
-- 3. LARGE DRINK - $2.19
-- 4. DOMESTIC BEER - $4.99
--
-- ITEM_ASSIGNMENTS TABLE (2 assignments - your selections):
-- 1. CHICKEN BURRITO - share: 100%, amount: $8.79
-- 2. KIDS MEAL - MAKE OWN - share: 100%, amount: $4.99
-- Total: $14.54
--
-- STORAGE:
-- - Bucket: split-receipts
-- - Path: {your-user-id}/receipts/{timestamp}.jpg
-- - Public URL should be accessible
