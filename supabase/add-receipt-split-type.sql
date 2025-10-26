-- ============================================================================
-- Add 'receipt' to splits table split_type constraint
-- ============================================================================
-- The splits table has a check constraint that only allows:
-- 'equal', 'custom', 'percentage'
--
-- We need to add 'receipt' for AI-scanned receipt splits

-- First, let's check the current constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'splits'::regclass
AND conname LIKE '%split_type%';

-- Drop the old constraint
ALTER TABLE splits
DROP CONSTRAINT IF EXISTS splits_split_type_check;

-- Add the new constraint with 'receipt' included
ALTER TABLE splits
ADD CONSTRAINT splits_split_type_check
CHECK (split_type IN ('equal', 'custom', 'percentage', 'receipt'));

-- Verify the new constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'splits'::regclass
AND conname = 'splits_split_type_check';
