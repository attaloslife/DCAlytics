create table if not exists public.exchange_connections (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  exchange_slug text not null,
  label text,
  account_hint text,
  api_key_label text,
  status text not null default 'active' check (status in ('active', 'paused', 'error')),
  read_only boolean not null default true,
  sync_balances boolean not null default true,
  sync_trades boolean not null default true,
  testnet boolean not null default false,
  last_sync_status text not null default 'idle' check (last_sync_status in ('idle', 'queued', 'running', 'completed', 'failed')),
  last_sync_requested_at timestamptz,
  last_sync_completed_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exchange_connections_portfolio_id_idx
  on public.exchange_connections(portfolio_id);

create index if not exists exchange_connections_exchange_slug_idx
  on public.exchange_connections(exchange_slug);

create index if not exists exchange_connections_status_idx
  on public.exchange_connections(status);

drop trigger if exists exchange_connections_set_updated_at on public.exchange_connections;
create trigger exchange_connections_set_updated_at
before update on public.exchange_connections
for each row
execute function public.set_updated_at();

alter table public.exchange_connections enable row level security;

drop policy if exists "exchange_connections_select_member" on public.exchange_connections;
create policy "exchange_connections_select_member"
on public.exchange_connections
for select
to authenticated
using (public.has_portfolio_access(portfolio_id));

drop policy if exists "exchange_connections_modify_member" on public.exchange_connections;
create policy "exchange_connections_modify_member"
on public.exchange_connections
for all
to authenticated
using (public.has_portfolio_access(portfolio_id))
with check (public.has_portfolio_access(portfolio_id));

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references public.portfolios(id) on delete cascade,
  target_type text not null check (target_type in ('wallet', 'exchange', 'prices', 'nft', 'defi')),
  target_id uuid,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  result_summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists sync_runs_portfolio_id_idx on public.sync_runs(portfolio_id);
create index if not exists sync_runs_target_type_idx on public.sync_runs(target_type);
create index if not exists sync_runs_status_idx on public.sync_runs(status);

alter table public.sync_runs enable row level security;

drop policy if exists "sync_runs_select_member" on public.sync_runs;
create policy "sync_runs_select_member"
on public.sync_runs
for select
to authenticated
using (
  portfolio_id is null
  or public.has_portfolio_access(portfolio_id)
);

drop policy if exists "sync_runs_modify_member" on public.sync_runs;
create policy "sync_runs_modify_member"
on public.sync_runs
for all
to authenticated
using (
  portfolio_id is null
  or public.has_portfolio_access(portfolio_id)
)
with check (
  portfolio_id is null
  or public.has_portfolio_access(portfolio_id)
);
