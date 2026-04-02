insert into public.chains (slug, name, family, native_symbol, chain_reference)
values
  ('bitcoin', 'Bitcoin', 'bitcoin', 'BTC', 'bitcoin'),
  ('ethereum', 'Ethereum', 'evm', 'ETH', '1'),
  ('base', 'Base', 'evm', 'ETH', '8453'),
  ('arbitrum', 'Arbitrum', 'evm', 'ETH', '42161'),
  ('optimism', 'Optimism', 'evm', 'ETH', '10'),
  ('polygon', 'Polygon', 'evm', 'POL', '137'),
  ('gnosis', 'Gnosis', 'evm', 'XDAI', '100'),
  ('scroll', 'Scroll', 'evm', 'ETH', '534352'),
  ('solana', 'Solana', 'solana', 'SOL', 'solana')
on conflict (slug) do update
set
  name = excluded.name,
  family = excluded.family,
  native_symbol = excluded.native_symbol,
  chain_reference = excluded.chain_reference,
  is_active = true;

insert into public.assets (symbol, name, asset_type, coingecko_id)
values
  ('BTC', 'Bitcoin', 'coin', 'bitcoin'),
  ('ETH', 'Ethereum', 'coin', 'ethereum'),
  ('SOL', 'Solana', 'coin', 'solana'),
  ('USDC', 'USD Coin', 'token', 'usd-coin'),
  ('USDT', 'Tether', 'token', 'tether'),
  ('ARB', 'Arbitrum', 'token', 'arbitrum'),
  ('POL', 'Polygon Ecosystem Token', 'token', 'polygon-ecosystem-token')
on conflict do nothing;

insert into public.asset_deployments (
  asset_id,
  chain_id,
  contract_address,
  decimals,
  provider_symbol,
  provider_name,
  is_native
)
values
  (
    (select id from public.assets where coingecko_id = 'bitcoin'),
    (select id from public.chains where slug = 'bitcoin'),
    null,
    8,
    'BTC',
    'Bitcoin',
    true
  ),
  (
    (select id from public.assets where coingecko_id = 'ethereum'),
    (select id from public.chains where slug = 'ethereum'),
    null,
    18,
    'ETH',
    'Ethereum',
    true
  ),
  (
    (select id from public.assets where coingecko_id = 'solana'),
    (select id from public.chains where slug = 'solana'),
    null,
    9,
    'SOL',
    'Solana',
    true
  ),
  (
    (select id from public.assets where coingecko_id = 'usd-coin'),
    (select id from public.chains where slug = 'ethereum'),
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    6,
    'USDC',
    'USD Coin',
    false
  ),
  (
    (select id from public.assets where coingecko_id = 'usd-coin'),
    (select id from public.chains where slug = 'base'),
    '0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913',
    6,
    'USDC',
    'USD Coin',
    false
  ),
  (
    (select id from public.assets where coingecko_id = 'tether'),
    (select id from public.chains where slug = 'ethereum'),
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    6,
    'USDT',
    'Tether',
    false
  )
on conflict do nothing;

insert into public.asset_aliases (asset_id, alias, alias_kind)
values
  ((select id from public.assets where coingecko_id = 'bitcoin'), 'bitcoin', 'name'),
  ((select id from public.assets where coingecko_id = 'bitcoin'), 'btc', 'symbol'),
  ((select id from public.assets where coingecko_id = 'bitcoin'), 'bitcoin', 'slug'),
  ((select id from public.assets where coingecko_id = 'ethereum'), 'ethereum', 'name'),
  ((select id from public.assets where coingecko_id = 'ethereum'), 'eth', 'symbol'),
  ((select id from public.assets where coingecko_id = 'ethereum'), 'ethereum', 'slug'),
  ((select id from public.assets where coingecko_id = 'solana'), 'solana', 'name'),
  ((select id from public.assets where coingecko_id = 'solana'), 'sol', 'symbol'),
  ((select id from public.assets where coingecko_id = 'solana'), 'solana', 'slug'),
  ((select id from public.assets where coingecko_id = 'usd-coin'), 'usd coin', 'name'),
  ((select id from public.assets where coingecko_id = 'usd-coin'), 'usdc', 'symbol'),
  ((select id from public.assets where coingecko_id = 'usd-coin'), 'usd-coin', 'slug'),
  ((select id from public.assets where coingecko_id = 'tether'), 'tether', 'name'),
  ((select id from public.assets where coingecko_id = 'tether'), 'usdt', 'symbol'),
  ((select id from public.assets where coingecko_id = 'tether'), 'tether', 'slug')
on conflict do nothing;
