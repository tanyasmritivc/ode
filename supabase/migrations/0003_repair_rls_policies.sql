-- Repair migration: the granular RLS policies from 0001_init.sql were found
-- to be missing on the live database (only the bare tables existed — likely
-- because 0001_init.sql was never fully executed against this project).
-- This re-applies every policy idempotently; safe to run even if some
-- already exist.

alter table profiles enable row level security;
alter table posts enable row level security;
alter table tags enable row level security;
alter table post_tags enable row level security;
alter table follows enable row level security;
alter table weaves enable row level security;
alter table weave_posts enable row level security;

-- profiles
drop policy if exists "profiles are viewable by everyone" on profiles;
create policy "profiles are viewable by everyone"
  on profiles for select
  using (true);

drop policy if exists "users can insert their own profile" on profiles;
create policy "users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "users can delete their own profile" on profiles;
create policy "users can delete their own profile"
  on profiles for delete
  using (id = auth.uid());

-- posts
drop policy if exists "posts are viewable by everyone" on posts;
create policy "posts are viewable by everyone"
  on posts for select
  using (true);

drop policy if exists "users can insert their own posts" on posts;
create policy "users can insert their own posts"
  on posts for insert
  with check (user_id = auth.uid());

drop policy if exists "users can update their own posts" on posts;
create policy "users can update their own posts"
  on posts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users can delete their own posts" on posts;
create policy "users can delete their own posts"
  on posts for delete
  using (user_id = auth.uid());

-- tags
drop policy if exists "tags are viewable by everyone" on tags;
create policy "tags are viewable by everyone"
  on tags for select
  using (true);

drop policy if exists "authenticated users can insert tags" on tags;
create policy "authenticated users can insert tags"
  on tags for insert
  to authenticated
  with check (true);

-- post_tags
drop policy if exists "post_tags are viewable by everyone" on post_tags;
create policy "post_tags are viewable by everyone"
  on post_tags for select
  using (true);

drop policy if exists "authenticated users can insert post_tags for their own posts" on post_tags;
create policy "authenticated users can insert post_tags for their own posts"
  on post_tags for insert
  to authenticated
  with check (
    exists (
      select 1 from posts
      where posts.id = post_tags.post_id
      and posts.user_id = auth.uid()
    )
  );

-- follows
drop policy if exists "follows are viewable by everyone" on follows;
create policy "follows are viewable by everyone"
  on follows for select
  using (true);

drop policy if exists "users can insert their own follows" on follows;
create policy "users can insert their own follows"
  on follows for insert
  with check (follower_id = auth.uid());

drop policy if exists "users can delete their own follows" on follows;
create policy "users can delete their own follows"
  on follows for delete
  using (follower_id = auth.uid());

-- weaves
drop policy if exists "weaves are viewable by everyone" on weaves;
create policy "weaves are viewable by everyone"
  on weaves for select
  using (true);

drop policy if exists "users can insert their own weaves" on weaves;
create policy "users can insert their own weaves"
  on weaves for insert
  with check (user_id = auth.uid());

drop policy if exists "users can update their own weaves" on weaves;
create policy "users can update their own weaves"
  on weaves for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users can delete their own weaves" on weaves;
create policy "users can delete their own weaves"
  on weaves for delete
  using (user_id = auth.uid());

-- weave_posts
drop policy if exists "weave_posts are viewable by everyone" on weave_posts;
create policy "weave_posts are viewable by everyone"
  on weave_posts for select
  using (true);

drop policy if exists "users can insert weave_posts for their own weaves" on weave_posts;
create policy "users can insert weave_posts for their own weaves"
  on weave_posts for insert
  with check (
    exists (
      select 1 from weaves
      where weaves.id = weave_posts.weave_id
      and weaves.user_id = auth.uid()
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
  );
