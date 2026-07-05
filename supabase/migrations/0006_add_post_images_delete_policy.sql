-- The post-images bucket has never had a DELETE policy on storage.objects
-- (0002_storage_policies.sql only added select + insert), so the new
-- "delete post" feature's storage.remove() call was silently matching zero
-- rows under RLS - the file stayed orphaned in the bucket even though no
-- error was returned. Same missing-policy pattern as the tags UPDATE bug.
drop policy if exists "users can delete their own post images" on storage.objects;
create policy "users can delete their own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
