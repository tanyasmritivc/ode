-- Storage bucket setup + RLS policies for avatars and post-images.
-- Buckets are public (readable by anyone) but writes are restricted to the
-- owning user's own folder, matching the `${userId}/...` path convention
-- used by app/profile/edit/page.tsx and app/post/new/page.tsx.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "avatar images are publicly accessible" on storage.objects;
create policy "avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users can upload their own avatar" on storage.objects;
create policy "users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users can update their own avatar" on storage.objects;
create policy "users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post images are publicly accessible" on storage.objects;
create policy "post images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "users can upload their own post images" on storage.objects;
create policy "users can upload their own post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
