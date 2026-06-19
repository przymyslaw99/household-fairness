create unique index chores_household_normalized_name_idx
  on public.chores (household_id, lower(btrim(name)));

create function public.create_household_with_initial_chores(household_name text, chores jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_household_name text := btrim(coalesce(household_name, ''));
  current_user_id uuid := auth.uid();
  new_household_id uuid;
  chore_item jsonb;
  normalized_chore_name text;
  chore_weight integer;
  normalized_names text[] := array[]::text[];
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_household_name = '' then
    raise exception 'Household name is required';
  end if;

  if chores is null or jsonb_typeof(chores) <> 'array' or jsonb_array_length(chores) = 0 then
    raise exception 'At least one chore is required';
  end if;

  for chore_item in
    select value
    from jsonb_array_elements(chores)
  loop
    normalized_chore_name := btrim(coalesce(chore_item->>'name', ''));

    if normalized_chore_name = '' then
      raise exception 'Chore name is required';
    end if;

    if lower(normalized_chore_name) = any(normalized_names) then
      raise exception 'Duplicate chore names are not allowed';
    end if;

    normalized_names := array_append(normalized_names, lower(normalized_chore_name));

    begin
      chore_weight := (chore_item->>'weight')::integer;
    exception
      when invalid_text_representation then
        raise exception 'Chore weight must be a positive integer';
    end;

    if chore_weight <= 0 then
      raise exception 'Chore weight must be a positive integer';
    end if;
  end loop;

  new_household_id := public.create_household_with_owner(normalized_household_name);

  for chore_item in
    select value
    from jsonb_array_elements(chores)
  loop
    normalized_chore_name := btrim(coalesce(chore_item->>'name', ''));
    chore_weight := (chore_item->>'weight')::integer;

    insert into public.chores (household_id, name, weight, created_by)
    values (new_household_id, normalized_chore_name, chore_weight, current_user_id);
  end loop;

  return new_household_id;
end;
$$;

revoke all on function public.create_household_with_initial_chores(text, jsonb) from public;
grant execute on function public.create_household_with_initial_chores(text, jsonb) to authenticated;
