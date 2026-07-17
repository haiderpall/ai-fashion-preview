-- Create tryon-results bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('tryon-results', 'tryon-results', true)
on conflict (id) do nothing;

-- Drop existing broadly scoped policies if they exist to replace them with secure ones
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update" on storage.objects;

-- --- tryon-results RLS ---
create policy "Public Access tryon-results"
on storage.objects for select
using ( bucket_id = 'tryon-results' );

create policy "Users can upload to their own tryon-results folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'tryon-results' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own tryon-results folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'tryon-results' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- --- tryon-uploads RLS fix ---
-- (Assume "Public Access" select policy already exists from previous migration)
create policy "Users can upload to their own tryon-uploads folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'tryon-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own tryon-uploads folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'tryon-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
