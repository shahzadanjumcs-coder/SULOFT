-- SULOFT — Storage Buckets & Policies
-- =============================================================================
-- Run this file in your Supabase SQL Editor AFTER running supabase/schema.sql.
-- Creates a public-read bucket for item images and locks down writes to
-- authenticated users, scoped to their own folder.
-- =============================================================================

-- 1. Create the public item-images bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'item-images',
  'item-images',
  true,                                -- public so anyone can READ uploaded images
  5 * 1024 * 1024,                     -- 5 MB hard limit enforced at storage layer
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
where not exists (select 1 from storage.buckets where id = 'item-images');

-- Update in case it already exists but with different settings
update storage.buckets
set
  public = true,
  file_size_limit = 5 * 1024 * 1024,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
where id = 'item-images';

-- 2. RLS policies on storage.objects for the item-images bucket
-- Public can read (so item images render for unauthenticated visitors)
drop policy if exists "item_images_read_public" on storage.objects;
create policy "item_images_read_public" on storage.objects
  for select
  using (bucket_id = 'item-images');

-- Authenticated users can upload, but ONLY into a folder named after their own user id
drop policy if exists "item_images_insert_own" on storage.objects;
create policy "item_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update/delete their OWN uploads only
drop policy if exists "item_images_update_own" on storage.objects;
create policy "item_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'item-images'
    and owner = auth.uid()
  );

drop policy if exists "item_images_delete_own" on storage.objects;
create policy "item_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'item-images'
    and owner = auth.uid()
  );

-- Admins can delete any item image (e.g. when moderating an offensive listing)
drop policy if exists "item_images_delete_admin" on storage.objects;
create policy "item_images_delete_admin" on storage.objects
  for delete
  using (
    bucket_id = 'item-images' and public.is_admin()
  );

-- =============================================================================
-- End of storage setup.
-- =============================================================================
