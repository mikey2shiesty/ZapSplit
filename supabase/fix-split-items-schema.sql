-- ============================================================================
-- Fix split_items and item_assignments tables schema
-- ============================================================================
-- Add missing columns needed for receipt splits

-- ============================================================================
-- 1. Check current schema for split_items
-- ============================================================================
SELECT 'split_items current schema:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'split_items'
ORDER BY ordinal_position;

-- Add the missing 'price' column to split_items
ALTER TABLE split_items
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- Verify split_items was updated
SELECT 'split_items after adding price:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'split_items'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. Check current schema for item_assignments
-- ============================================================================
SELECT 'item_assignments current schema:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'item_assignments'
ORDER BY ordinal_position;

-- Add the missing 'amount' column to item_assignments
ALTER TABLE item_assignments
ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- Verify item_assignments was updated
SELECT 'item_assignments after adding amount:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'item_assignments'
ORDER BY ordinal_position;
