-- Comments: unlike likes, these do show who wrote them, but only ever
-- surface on the post detail page - never a preview on feed/masonry cards.
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create index on comments (post_id, created_at asc);

alter table comments enable row level security;

create policy "comments are viewable by everyone"
  on comments for select
  using (true);

create policy "users can comment as themselves"
  on comments for insert
  with check (user_id = auth.uid());

create policy "users can delete their own comments"
  on comments for delete
  using (user_id = auth.uid());
