-- ═══════════════════════════════════════════════════════════
-- 000003 — Storage bucket + object policies
-- Media library bucket: public read, authenticated write.
-- Type/size limits are enforced server-side in the upload API.
-- ═══════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/svg+xml',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

-- Public can read media objects
drop policy if exists media_objects_public_read on storage.objects;
create policy media_objects_public_read on storage.objects
  for select to anon
  using (bucket_id = 'media');

-- Authenticated admins can manage media objects
drop policy if exists media_objects_admin_insert on storage.objects;
create policy media_objects_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.has_admin_role('editor')
  );

drop policy if exists media_objects_admin_update on storage.objects;
create policy media_objects_admin_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and public.has_admin_role('editor')
  )
  with check (
    bucket_id = 'media'
    and public.has_admin_role('editor')
  );

drop policy if exists media_objects_admin_delete on storage.objects;
create policy media_objects_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and public.has_admin_role('administrator')
  );
