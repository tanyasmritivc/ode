-- Ode: core schema, indexes, and row level security policies

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null,
  bio text default '',
  avatar_url text,
  top_interests text[] default '{}',
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  image_url text not null,
  created_at timestamptz default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table post_tags (
  post_id uuid references posts(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create table weaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  prompt text not null,
  created_at timestamptz default now()
);

create table weave_posts (
  weave_id uuid references weaves(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  position int not null,
  primary key (weave_id, post_id)
);

create index on tags using gin (to_tsvector('english', name));
create index on posts using gin (to_tsvector('english', title));
create index on posts (user_id);
create index on posts (created_at desc);
create index on post_tags (tag_id);
create index on follows (following_id);
create index on weave_posts (weave_id, position);

-- Row level security

alter table profiles enable row level security;
alter table posts enable row level security;
alter table tags enable row level security;
alter table post_tags enable row level security;
alter table follows enable row level security;
alter table weaves enable row level security;
alter table weave_posts enable row level security;

-- profiles: readable by anyone, writable only by the owner
create policy "profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users can delete their own profile"
  on profiles for delete
  using (id = auth.uid());

-- posts: readable by anyone, writable only by the owner
create policy "posts are viewable by everyone"
  on posts for select
  using (true);

create policy "users can insert their own posts"
  on posts for insert
  with check (user_id = auth.uid());

create policy "users can update their own posts"
  on posts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users can delete their own posts"
  on posts for delete
  using (user_id = auth.uid());

-- tags: readable by anyone, insertable by any authenticated user, no direct deletes
create policy "tags are viewable by everyone"
  on tags for select
  using (true);

create policy "authenticated users can insert tags"
  on tags for insert
  to authenticated
  with check (true);

-- post_tags: readable by anyone, insertable by any authenticated user
-- (ownership of the referenced post is enforced by the posts RLS policies),
-- deletes only happen via cascade when a post is deleted by its owner
create policy "post_tags are viewable by everyone"
  on post_tags for select
  using (true);

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

-- follows: readable by anyone, writable only by the follower
create policy "follows are viewable by everyone"
  on follows for select
  using (true);

create policy "users can insert their own follows"
  on follows for insert
  with check (follower_id = auth.uid());

create policy "users can delete their own follows"
  on follows for delete
  using (follower_id = auth.uid());

-- weaves: readable by anyone, writable only by the owner
create policy "weaves are viewable by everyone"
  on weaves for select
  using (true);

create policy "users can insert their own weaves"
  on weaves for insert
  with check (user_id = auth.uid());

create policy "users can update their own weaves"
  on weaves for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users can delete their own weaves"
  on weaves for delete
  using (user_id = auth.uid());

-- weave_posts: readable by anyone, writable only by the owning weave's owner
create policy "weave_posts are viewable by everyone"
  on weave_posts for select
  using (true);

create policy "users can insert weave_posts for their own weaves"
  on weave_posts for insert
  with check (
    exists (
      select 1 from weaves
      where weaves.id = weave_posts.weave_id
      and weaves.user_id = auth.uid()
    )
  );

create policy "users can update weave_posts for their own weaves"
  on weave_posts for update
  using (
    exists (
      select 1 from weaves
      where weaves.id = weave_posts.weave_id
      and weaves.user_id = auth.uid()
    )
  );

create policy "users can delete weave_posts for their own weaves"
  on weave_posts for delete
  using (
    exists (
      select 1 from weaves
      where weaves.id = weave_posts.weave_id
      and weaves.user_id = auth.uid()
    )
  );

-- Auto-create a profiles row whenever someone signs up. Runs as security
-- definer so it isn't blocked by the profiles RLS policies, and it fires
-- regardless of whether email confirmation delays the client session.
-- Username/name are passed in via supabase.auth.signUp({ options: { data } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'name', 'New user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
