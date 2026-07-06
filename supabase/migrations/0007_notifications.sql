-- Follow notifications: a recipient can see/mark-read their own notifications,
-- but never insert them directly - rows are only ever created by the
-- security-definer trigger below, atomically with the follow itself.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete cascade,
  type text not null check (type in ('follow', 'follow_back')),
  read boolean default false,
  created_at timestamptz default now()
);

create index on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "users can view their own notifications"
  on notifications for select
  using (recipient_id = auth.uid());

create policy "users can update their own notifications"
  on notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Settings toggle consumed by the trigger below (section 3 of this pass also
-- surfaces this as a switch on the settings page).
alter table profiles add column notify_on_follow boolean default true;

-- Fires atomically with every new follow row: notifies the person being
-- followed, distinguishing a fresh follow from one that completes a mutual
-- pair, and skips the insert entirely if the recipient has opted out.
create or replace function public.handle_new_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_wants_notif boolean;
  is_mutual boolean;
begin
  select coalesce(notify_on_follow, true) into recipient_wants_notif
  from profiles
  where id = new.following_id;

  if recipient_wants_notif then
    select exists (
      select 1 from follows
      where follower_id = new.following_id
      and following_id = new.follower_id
    ) into is_mutual;

    insert into notifications (recipient_id, actor_id, type)
    values (
      new.following_id,
      new.follower_id,
      case when is_mutual then 'follow_back' else 'follow' end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_follow_created on follows;
create trigger on_follow_created
  after insert on follows
  for each row execute function public.handle_new_follow();
