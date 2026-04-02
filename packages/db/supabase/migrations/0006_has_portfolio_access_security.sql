create or replace function public.has_portfolio_access(target_portfolio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portfolio_members pm
    where pm.portfolio_id = target_portfolio_id
      and pm.user_id = auth.uid()
  );
$$;
