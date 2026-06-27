create function public.create_or_get_active_invite(target_household_id uuid, invite_token text)
returns table (
  id uuid,
  household_id uuid,
  token text,
  created_by uuid,
  created_at timestamptz,
  disabled_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if target_household_id is null then
    raise exception 'Household is required';
  end if;

  if length(btrim(invite_token)) < 16 then
    raise exception 'Invite token must be at least 16 characters';
  end if;

  if not public.is_household_owner(target_household_id) then
    raise exception 'Only household owners can manage invites';
  end if;

  return query
    select
      hi.id,
      hi.household_id,
      hi.token,
      hi.created_by,
      hi.created_at,
      hi.disabled_at
    from public.household_invites hi
    where hi.household_id = target_household_id
      and hi.disabled_at is null
    order by hi.created_at desc
    limit 1;

  if found then
    return;
  end if;

  begin
    return query
      insert into public.household_invites (household_id, token, created_by)
      values (target_household_id, btrim(invite_token), current_user_id)
      returning
        household_invites.id,
        household_invites.household_id,
        household_invites.token,
        household_invites.created_by,
        household_invites.created_at,
        household_invites.disabled_at;
  exception
    when unique_violation then
      return query
        select
          hi.id,
          hi.household_id,
          hi.token,
          hi.created_by,
          hi.created_at,
          hi.disabled_at
        from public.household_invites hi
        where hi.household_id = target_household_id
          and hi.disabled_at is null
        order by hi.created_at desc
        limit 1;
  end;
end;
$$;

create function public.disable_active_invite(target_household_id uuid)
returns table (
  id uuid,
  household_id uuid,
  token text,
  created_by uuid,
  created_at timestamptz,
  disabled_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if target_household_id is null then
    raise exception 'Household is required';
  end if;

  if not public.is_household_owner(target_household_id) then
    raise exception 'Only household owners can manage invites';
  end if;

  return query
    update public.household_invites hi
    set disabled_at = now()
    where hi.household_id = target_household_id
      and hi.disabled_at is null
    returning
      hi.id,
      hi.household_id,
      hi.token,
      hi.created_by,
      hi.created_at,
      hi.disabled_at;
end;
$$;

revoke all on function public.create_or_get_active_invite(uuid, text) from public;
revoke all on function public.disable_active_invite(uuid) from public;
grant execute on function public.create_or_get_active_invite(uuid, text) to authenticated;
grant execute on function public.disable_active_invite(uuid) to authenticated;
