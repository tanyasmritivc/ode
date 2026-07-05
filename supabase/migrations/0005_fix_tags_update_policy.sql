-- Root-cause fix for "only one tag ever saves" (see conversation for the
-- full investigation): app/(app)/post/new/page.tsx upserts into `tags` with
-- `onConflict: "name", ignoreDuplicates: false`, which performs an UPDATE
-- whenever a tag name already exists. The `tags` table has never had an
-- UPDATE policy (only select + insert were ever created), so Postgres RLS
-- rejects the whole multi-row upsert statement as soon as any post reuses an
-- existing tag name, and none of that post's tags get linked via post_tags.
-- Tags have no owner column, so any authenticated user may update them.
drop policy if exists "authenticated users can update tags" on tags;
create policy "authenticated users can update tags"
  on tags for update
  to authenticated
  using (true)
  with check (true);
