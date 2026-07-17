-- Create tryon-uploads bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('tryon-uploads', 'tryon-uploads', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'tryon-uploads' );

create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'tryon-uploads' );

-- Create tryon_jobs table
create table tryon_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  status text default 'pending', -- pending | processing | succeeded | failed
  person_image_url text not null,
  garment_image_url text not null,
  result_image_url text,
  event_id text,
  error text,
  created_at timestamp with time zone default now()
);

-- RLS
alter table tryon_jobs enable row level security;
create policy "Users can view their own jobs" on tryon_jobs for select using (auth.uid() = user_id);
create policy "Users can insert their own jobs" on tryon_jobs for insert with check (auth.uid() = user_id);
create policy "Users can update their own jobs" on tryon_jobs for update using (auth.uid() = user_id);
