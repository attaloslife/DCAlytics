create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_locale text not null default 'en',
  default_currency text not null default 'usd',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  base_currency text not null default 'usd',
  description text,
  color_tag text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolios_owner_user_id_idx on public.portfolios(owner_user_id);

create table if not exists public.portfolio_members (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (portfolio_id, user_id)
);

create index if not exists portfolio_members_user_id_idx on public.portfolio_members(user_id);

create table if not exists public.chains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  family text not null check (family in ('bitcoin', 'evm', 'solana', 'cosmos', 'other')),
  native_symbol text,
  chain_reference text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  asset_type text not null check (asset_type in ('coin', 'token', 'nft', 'lp_token', 'other')),
  coingecko_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assets_symbol_idx on public.assets(symbol);
create index if not exists assets_coingecko_id_idx on public.assets(coingecko_id);

create table if not exists public.asset_deployments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  chain_id uuid references public.chains(id) on delete cascade,
  contract_address text,
  decimals integer,
  provider_symbol text,
  provider_name text,
  is_native boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique nulls not distinct (asset_id, chain_id, contract_address)
);

create index if not exists asset_deployments_asset_id_idx on public.asset_deployments(asset_id);
create index if not exists asset_deployments_chain_id_idx on public.asset_deployments(chain_id);

create table if not exists public.asset_aliases (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  alias text not null,
  alias_kind text not null check (alias_kind in ('name', 'symbol', 'slug', 'provider')),
  unique (asset_id, alias, alias_kind)
);

create index if not exists asset_aliases_alias_idx on public.asset_aliases(alias);

create table if not exists public.source_records (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  source_type text not null check (source_type in ('manual', 'import', 'txid', 'wallet', 'exchange')),
  source_provider text,
  external_id text,
  fingerprint text,
  raw_payload jsonb not null default '{}'::jsonb,
  observed_at timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique nulls not distinct (portfolio_id, source_type, source_provider, external_id)
);

create index if not exists source_records_portfolio_id_idx on public.source_records(portfolio_id);
create index if not exists source_records_fingerprint_idx on public.source_records(fingerprint);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  source_record_id uuid references public.source_records(id) on delete set null,
  chain_id uuid references public.chains(id) on delete set null,
  asset_id uuid not null references public.assets(id) on delete restrict,
  entry_type text not null check (
    entry_type in (
      'buy',
      'sell',
      'transfer_in',
      'transfer_out',
      'income',
      'fee',
      'adjustment'
    )
  ),
  quantity numeric(38, 18) not null,
  unit_price numeric(38, 18),
  gross_value numeric(38, 18),
  fee_value numeric(38, 18) not null default 0,
  fee_asset_id uuid references public.assets(id) on delete set null,
  currency_code text not null default 'usd',
  tx_hash text,
  external_ref text,
  notes text,
  transfer_group_id uuid,
  dedupe_hash text,
  occurred_at timestamptz not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ledger_entries_portfolio_occurred_idx on public.ledger_entries(portfolio_id, occurred_at desc);
create index if not exists ledger_entries_asset_id_idx on public.ledger_entries(asset_id);
create index if not exists ledger_entries_transfer_group_id_idx on public.ledger_entries(transfer_group_id);
create index if not exists ledger_entries_dedupe_hash_idx on public.ledger_entries(dedupe_hash);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  uploaded_by_user_id uuid references auth.users(id) on delete set null,
  file_name text not null,
  file_type text not null check (file_type in ('csv', 'json')),
  status text not null check (status in ('uploaded', 'parsed', 'validated', 'completed', 'failed')),
  row_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  storage_path text,
  error_summary text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists imports_portfolio_id_idx on public.imports(portfolio_id);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.imports(id) on delete cascade,
  row_number integer not null,
  raw_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  message text,
  created_at timestamptz not null default now(),
  unique (import_id, row_number)
);

create index if not exists import_rows_import_id_idx on public.import_rows(import_id);

create or replace function public.has_portfolio_access(target_portfolio_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.portfolio_members pm
    where pm.portfolio_id = target_portfolio_id
      and pm.user_id = auth.uid()
  );
$$;

create or replace function public.sync_portfolio_owner_membership()
returns trigger
language plpgsql
as $$
begin
  insert into public.portfolio_members (portfolio_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (portfolio_id, user_id) do update set role = excluded.role;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists portfolios_set_updated_at on public.portfolios;
create trigger portfolios_set_updated_at
before update on public.portfolios
for each row
execute function public.set_updated_at();

drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

drop trigger if exists ledger_entries_set_updated_at on public.ledger_entries;
create trigger ledger_entries_set_updated_at
before update on public.ledger_entries
for each row
execute function public.set_updated_at();

drop trigger if exists portfolios_sync_owner_membership on public.portfolios;
create trigger portfolios_sync_owner_membership
after insert on public.portfolios
for each row
execute function public.sync_portfolio_owner_membership();

alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_members enable row level security;
alter table public.chains enable row level security;
alter table public.assets enable row level security;
alter table public.asset_deployments enable row level security;
alter table public.asset_aliases enable row level security;
alter table public.source_records enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.imports enable row level security;
alter table public.import_rows enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "portfolios_select_member" on public.portfolios;
create policy "portfolios_select_member"
on public.portfolios
for select
to authenticated
using (public.has_portfolio_access(id));

drop policy if exists "portfolios_insert_owner" on public.portfolios;
create policy "portfolios_insert_owner"
on public.portfolios
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "portfolios_update_owner" on public.portfolios;
create policy "portfolios_update_owner"
on public.portfolios
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "portfolios_delete_owner" on public.portfolios;
create policy "portfolios_delete_owner"
on public.portfolios
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "portfolio_members_select_member" on public.portfolio_members;
create policy "portfolio_members_select_member"
on public.portfolio_members
for select
to authenticated
using (public.has_portfolio_access(portfolio_id));

drop policy if exists "portfolio_members_manage_owner" on public.portfolio_members;
create policy "portfolio_members_manage_owner"
on public.portfolio_members
for all
to authenticated
using (
  exists (
    select 1
    from public.portfolios p
    where p.id = portfolio_id
      and p.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.portfolios p
    where p.id = portfolio_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "chains_select_authenticated" on public.chains;
create policy "chains_select_authenticated"
on public.chains
for select
to authenticated
using (true);

drop policy if exists "assets_select_authenticated" on public.assets;
create policy "assets_select_authenticated"
on public.assets
for select
to authenticated
using (true);

drop policy if exists "asset_deployments_select_authenticated" on public.asset_deployments;
create policy "asset_deployments_select_authenticated"
on public.asset_deployments
for select
to authenticated
using (true);

drop policy if exists "asset_aliases_select_authenticated" on public.asset_aliases;
create policy "asset_aliases_select_authenticated"
on public.asset_aliases
for select
to authenticated
using (true);

drop policy if exists "source_records_select_member" on public.source_records;
create policy "source_records_select_member"
on public.source_records
for select
to authenticated
using (public.has_portfolio_access(portfolio_id));

drop policy if exists "source_records_modify_member" on public.source_records;
create policy "source_records_modify_member"
on public.source_records
for all
to authenticated
using (public.has_portfolio_access(portfolio_id))
with check (public.has_portfolio_access(portfolio_id));

drop policy if exists "ledger_entries_select_member" on public.ledger_entries;
create policy "ledger_entries_select_member"
on public.ledger_entries
for select
to authenticated
using (public.has_portfolio_access(portfolio_id));

drop policy if exists "ledger_entries_modify_member" on public.ledger_entries;
create policy "ledger_entries_modify_member"
on public.ledger_entries
for all
to authenticated
using (public.has_portfolio_access(portfolio_id))
with check (public.has_portfolio_access(portfolio_id));

drop policy if exists "imports_select_member" on public.imports;
create policy "imports_select_member"
on public.imports
for select
to authenticated
using (public.has_portfolio_access(portfolio_id));

drop policy if exists "imports_modify_member" on public.imports;
create policy "imports_modify_member"
on public.imports
for all
to authenticated
using (public.has_portfolio_access(portfolio_id))
with check (public.has_portfolio_access(portfolio_id));

drop policy if exists "import_rows_select_member" on public.import_rows;
create policy "import_rows_select_member"
on public.import_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.imports i
    where i.id = import_id
      and public.has_portfolio_access(i.portfolio_id)
  )
);

drop policy if exists "import_rows_modify_member" on public.import_rows;
create policy "import_rows_modify_member"
on public.import_rows
for all
to authenticated
using (
  exists (
    select 1
    from public.imports i
    where i.id = import_id
      and public.has_portfolio_access(i.portfolio_id)
  )
)
with check (
  exists (
    select 1
    from public.imports i
    where i.id = import_id
      and public.has_portfolio_access(i.portfolio_id)
  )
);
