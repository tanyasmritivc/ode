-- Likes: count is public, but the app never exposes who specifically liked a
-- post - only the aggregate count and the current viewer's own liked state.
create table likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create index on likes (post_id);

alter table likes enable row level security;

create policy "likes are viewable by everyone"
  on likes for select
  using (true);

create policy "users can like posts as themselves"
  on likes for insert
  with check (user_id = auth.uid());

create policy "users can remove their own likes"
  on likes for delete
  using (user_id = auth.uid());
