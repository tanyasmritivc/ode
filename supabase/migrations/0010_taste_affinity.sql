create table user_tag_affinity (
  user_id uuid references profiles(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  score numeric not null default 0,
  last_reinforced_at timestamptz not null default now(),
  primary key (user_id, tag_id)
);

alter table user_tag_affinity enable row level security;

create policy "users can view their own taste affinity"
  on user_tag_affinity for select
  using (user_id = auth.uid());

create policy "users can upsert their own taste affinity"
  on user_tag_affinity for insert
  with check (user_id = auth.uid());

create policy "users can update their own taste affinity"
  on user_tag_affinity for update
  using (user_id = auth.uid());

-- Atomic reinforce-or-create for every tag on a post, for one user - fired
-- when they post it (author) or like it (liker). security invoker (the
-- default, spelled out for clarity) so this still runs under the RLS
-- policies above: a caller can only ever reinforce their OWN affinity rows,
-- even though p_user_id/p_post_id/p_amount are caller-supplied.
create or replace function public.reinforce_post_tags(p_user_id uuid, p_post_id uuid, p_amount numeric default 1)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into user_tag_affinity (user_id, tag_id, score, last_reinforced_at)
  select p_user_id, pt.tag_id, p_amount, now()
  from post_tags pt
  where pt.post_id = p_post_id
  on conflict (user_id, tag_id)
  do update set score = user_tag_affinity.score + excluded.score, last_reinforced_at = now();
end;
$$;

grant execute on function public.reinforce_post_tags(uuid, uuid, numeric) to authenticated;
