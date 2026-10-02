-- Allow the app (anon key, client_id model) to read/write objects in uploads & renders
drop policy if exists client_storage_uploads_renders on storage.objects;
create policy client_storage_uploads_renders on storage.objects
  for all to anon, authenticated
  using (bucket_id in ('uploads', 'renders'))
  with check (bucket_id in ('uploads', 'renders'));