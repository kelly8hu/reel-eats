-- Create public storage bucket for recipe thumbnails
insert into storage.buckets (id, name, public)
values ('recipe-thumbnails', 'recipe-thumbnails', true)
on conflict (id) do nothing;

-- Allow the service role (used by the server) to upload and read objects
create policy "Service role can manage thumbnails"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'recipe-thumbnails')
  with check (bucket_id = 'recipe-thumbnails');

-- Allow anyone to read (public bucket — thumbnails are not sensitive)
create policy "Public can read thumbnails"
  on storage.objects
  for select
  to public
  using (bucket_id = 'recipe-thumbnails');
