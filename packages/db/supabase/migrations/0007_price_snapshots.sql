create table if not exists public.price_snapshots (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  currency_code text not null,
  price numeric(38, 18) not null,
  source_provider text not null,
  captured_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists price_snapshots_asset_currency_captured_idx
  on public.price_snapshots(asset_id, currency_code, captured_at desc);

create index if not exists price_snapshots_captured_at_idx
  on public.price_snapshots(captured_at desc);

alter table public.price_snapshots enable row level security;

drop policy if exists "price_snapshots_select_authenticated" on public.price_snapshots;
create policy "price_snapshots_select_authenticated"
on public.price_snapshots
for select
to authenticated
using (true);
