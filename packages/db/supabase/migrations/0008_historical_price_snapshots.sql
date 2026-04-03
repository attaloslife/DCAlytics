create table if not exists public.historical_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  currency_code text not null,
  requested_day date not null,
  status text not null check (status in ('ready', 'unavailable')),
  code text not null,
  price numeric(38, 18),
  matched_at timestamptz,
  note text not null,
  source_provider text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (asset_id, currency_code, requested_day)
);

create index if not exists historical_price_snapshots_asset_currency_day_idx
  on public.historical_price_snapshots(asset_id, currency_code, requested_day desc);

create index if not exists historical_price_snapshots_requested_day_idx
  on public.historical_price_snapshots(requested_day desc);

drop trigger if exists historical_price_snapshots_set_updated_at on public.historical_price_snapshots;
create trigger historical_price_snapshots_set_updated_at
before update on public.historical_price_snapshots
for each row
execute function public.set_updated_at();

alter table public.historical_price_snapshots enable row level security;

drop policy if exists "historical_price_snapshots_select_authenticated" on public.historical_price_snapshots;
create policy "historical_price_snapshots_select_authenticated"
on public.historical_price_snapshots
for select
to authenticated
using (true);
