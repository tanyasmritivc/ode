alter table notifications add column weave_id uuid references weaves(id) on delete cascade;

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('follow', 'follow_back', 'weave_invite'));

-- Fires atomically with every new collaborator add, notifying the invited
-- person - mirrors handle_new_follow's pattern (security definer trigger,
-- not a client-side insert, so no broad notifications insert policy is
-- needed).
create or replace function public.handle_new_weave_collaborator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from weaves where id = new.weave_id;

  if owner_id is not null and owner_id != new.user_id then
    insert into notifications (recipient_id, actor_id, type, weave_id)
    values (new.user_id, owner_id, 'weave_invite', new.weave_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_weave_collaborator_added on weave_collaborators;
create trigger on_weave_collaborator_added
  after insert on weave_collaborators
  for each row execute function public.handle_new_weave_collaborator();
