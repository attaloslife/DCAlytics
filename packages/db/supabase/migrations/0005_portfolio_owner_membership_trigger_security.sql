create or replace function public.sync_portfolio_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.portfolio_members (portfolio_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (portfolio_id, user_id) do update set role = excluded.role;

  return new;
end;
$$;
