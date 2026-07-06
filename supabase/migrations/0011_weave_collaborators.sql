create table weave_collaborators (
  weave_id uuid references weaves(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (weave_id, user_id)
);

alter table weave_collaborators enable row level security;

create policy "weave collaborators are viewable by everyone"
  on weave_collaborators for select
  using (true);

create policy "only the weave owner can add collaborators"
  on weave_collaborators for insert
  with check (
    exists (select 1 from weaves where weaves.id = weave_id and weaves.user_id = auth.uid())
  );

create policy "owner can remove collaborators, or a collaborator can remove themself"
  on weave_collaborators for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from weaves where weaves.id = weave_id and weaves.user_id = auth.uid())
  );

-- Broaden weave_posts write access: a collaborator can add/remove pins on a
-- board just like the owner can. Deleting the whole weave stays owner-only
-- (that's enforced by the weaves table's own delete policy, untouched here).
drop policy if exists "users can insert weave_posts for their own weaves" on weave_posts;
create policy "users can insert weave_posts for their own weaves"
  on weave_posts for insert
  with check (
    exists (
      select 1 from weaves
      where weaves.id = weave_posts.weave_id
      and weaves.user_id = auth.uid()
    )
    or exists (
      select 1 from weave_collaborators
      where weave_collaborators.weave_id = weave_posts.weave_id
      and weave_collaborators.user_id = auth.uid()
    )
  );

drop policy if exists "users can update weave_posts for their own weaves" on weave_posts;
create policy "users can update weave_posts for their own weaves"
  on weave_posts for update
  using (
    exists (
      select 1 from weaves
      where weaves.id = weave_posts.weave_id
      and weaves.user_id = auth.uid()
    )
    or exists (
      select 1 from weave_collaborators
      where weave_collaborators.weave_id = weave_posts.weave_id
      and weave_collaborators.user_id = auth.uid()
    )
  );

drop policy if exists "users can delete weave_posts for their own weaves" on weave_posts;
create policy "users can delete weave_posts for their own weaves"
  on weave_posts for delete
  using (
    exists (
      select 1 from weaves
      where weaves.id = weave_posts.weave_id
      and weaves.user_id = auth.uid()
    )
    or exists (
      select 1 from weave_collaborators
      where weave_collaborators.weave_id = weave_posts.weave_id
      and weave_collaborators.user_id = auth.uid()
    )
  );
