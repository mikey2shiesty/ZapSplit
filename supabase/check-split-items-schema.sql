-- Check the actual schema of split_items table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'split_items'
ORDER BY ordinal_position;
