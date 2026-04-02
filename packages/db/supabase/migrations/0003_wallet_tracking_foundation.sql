create table if not exists public.wallet_addresses (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  chain_id uuid not null references public.chains(id) on delete restrict,
  address text not null,
  address_normalized text not null,
  label text,
  ownership_type text not null default 'owned' check (ownership_type in ('owned', 'watched')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, chain_id, address_normalized)
);

create index if not exists wallet_addresses_portfolio_id_idx on public.wallet_addresses(portfolio_id);
create index if not exists wallet_addresses_chain_id_idx on public.wallet_addresses(chain_id);
create index if not exists wallet_addresses_address_normalized_idx on public.wallet_addresses(address_normalized);

drop trigger if exists wallet_addresses_set_updated_at on public.wallet_addresses;
create trigger wallet_addresses_set_updated_at
before update on public.wallet_addresses
for each row
execute function public.set_updated_at();

alter table public.wallet_addresses enable row level security;

drop policy if exists "wallet_addresses_select_member" on public.wallet_addresses;
create policy "wallet_addresses_select_member"
on public.wallet_addresses
for select
to authenticated
using (public.has_portfolio_access(portfolio_id));

drop policy if exists "wallet_addresses_modify_member" on public.wallet_addresses;
create policy "wallet_addresses_modify_member"
on public.wallet_addresses
for all
to authenticated
using (public.has_portfolio_access(portfolio_id))
with check (public.has_portfolio_access(portfolio_id));
