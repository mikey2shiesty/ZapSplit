# Supabase Storage Setup Guide

This guide will help you set up the storage bucket for receipt images in ZapSplit.

## Required Storage Bucket

ZapSplit uses **one storage bucket** for all receipt images:
- Bucket name: `split-receipts`
- Used for: AI-scanned receipt images and manual split receipts

---

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Create the Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name:** `split-receipts`
   - **Public bucket:** ✅ **Enable** (receipts need to be shared with split participants)
   - **File size limit:** 5 MB (sufficient for receipt photos)
   - **Allowed MIME types:** `image/jpeg, image/png, image/jpg`

5. Click **"Create bucket"**

### Step 2: Set Up RLS Policies

After creating the bucket, set up Row Level Security policies:

1. In the Storage section, click on the `split-receipts` bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Users to Upload to Their Own Folder

- **Policy name:** `Users can upload to own folder`
- **Policy definition:** `INSERT`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'split-receipts'
AND (storage.foldername(name))[1] = auth.uid()::text
```

This allows users to upload files to folders named with their user ID (e.g., `userId/receipts/12345.jpg`)

#### Policy 2: Allow Public Read Access

- **Policy name:** `Public read access for receipts`
- **Policy definition:** `SELECT`
- **Target roles:** `public, authenticated`
- **USING expression:**
```sql
bucket_id = 'split-receipts'
```

This allows anyone with the URL to view receipts (needed for sharing splits)

#### Policy 3: Allow Users to Delete Their Own Files

- **Policy name:** `Users can delete own files`
- **Policy definition:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
bucket_id = 'split-receipts'
AND (storage.foldername(name))[1] = auth.uid()::text
```

---

## Method 2: Using SQL (For Advanced Users)

If you prefer to set up everything via SQL, run these commands in the Supabase SQL editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'split-receipts',
  'split-receipts',
  true,
  5242880, -- 5 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
);

-- Policy 1: Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'split-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow public read access
CREATE POLICY "Public read access for receipts"
ON storage.objects
FOR SELECT
TO public, authenticated
USING (
  bucket_id = 'split-receipts'
);

-- Policy 3: Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'split-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Verify Setup

After setting up the bucket, verify it works:

1. **Check bucket exists:**
   - Go to Supabase Dashboard → Storage
   - You should see `split-receipts` bucket

2. **Check public access:**
   - The bucket should show a "Public" badge

3. **Check policies:**
   - Click on the bucket → Policies tab
   - You should see 3 policies (INSERT, SELECT, DELETE)

4. **Test upload:**
   - Run the app
   - Scan a receipt
   - Check if the image uploads successfully
   - The app should show "Split Created!" without errors

---

## Folder Structure

Receipts are organized by user ID:

```
split-receipts/
├── {user-id-1}/
│   ├── receipts/
│   │   ├── 1234567890.jpg
│   │   └── 1234567891.jpg
│   └── {split-id-1}-timestamp.jpg
└── {user-id-2}/
    ├── receipts/
    │   └── 1234567892.jpg
    └── {split-id-2}-timestamp.jpg
```

- `{user-id}/receipts/` - AI-scanned receipt images
- `{user-id}/{split-id}-timestamp.jpg` - Manual split receipt images

---

## Troubleshooting

### Error: "Bucket 'split-receipts' not found"
- **Solution:** Create the bucket using Method 1 or Method 2 above

### Error: "new row violates row-level security policy"
- **Solution:** Check that RLS policies are set up correctly
- Make sure the INSERT policy allows `auth.uid()` to match the folder name

### Error: "File size exceeds limit"
- **Solution:** Increase the file size limit in bucket settings (5 MB recommended)

### Receipt uploads but can't be viewed
- **Solution:** Ensure the bucket is set to **Public**
- Check that the SELECT policy allows public access

---

## Security Notes

- ✅ **Users can only upload to their own folders** (based on auth.uid())
- ✅ **Receipts are publicly readable** (needed for split sharing)
- ✅ **Users can only delete their own files**
- ⚠️ **Receipt URLs are public** - Anyone with the URL can view the receipt
  - This is intentional for split sharing
  - Don't include sensitive information in receipt photos

---

## Need Help?

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Check browser console for detailed error messages
3. Verify your Supabase project URL and anon key in `.env`
4. Make sure you're authenticated (logged in) when testing uploads
