# DCAlytics Progress Tracker

This document is the short operational view of the rebuild.

Use it to answer:

- what is already done
- what is actively in progress
- what we should build next
- what belongs later so we do not lose sight of it

It complements the more detailed [Build Spec](./BUILD_SPEC.md).

## Current Snapshot

- `Phase 0 - Product + Architecture Reset`: complete enough for active development
- `Phase 1 - Core Account Experience`: largely complete
- `Phase 2 - Portfolio Tracking Engine`: in progress
- `Phase 3 - Broader Asset Coverage`: not started
- `Phase 4 - Engagement + Distribution`: not started
- `Phase 5 - Platform + Intelligence`: not started

## Completed

### Foundation

- monorepo and new web app scaffold
- Next.js App Router web app under `apps/web`
- Supabase-backed auth, portfolio model, and protected app shell
- core schema and migrations for portfolios, ledger, imports, wallets, pricing, and exchange foundation

### Account + Portfolio

- sign up
- sign in
- password reset
- unique display names
- multiple portfolios
- active portfolio switching
- portfolio archive and delete

### Ledger

- manual transaction entry
- TXID review flow in the rebuilt app
- trade log with edit and delete
- asset autocomplete for manual entry
- database-backed dashboard and trade log

### Data Movement

- CSV and JSON import
- CSV and JSON export
- import session history

### Wallet Tracking

- wallet tracking foundation
- chain-aware public address validation
- read-only live wallet preview
- rough balance and USD value preview for supported chains

### Market Data

- spot price snapshot cache
- historical price snapshot cache
- cache-first coin search behavior
- dashboard pricing moved onto internal market-data helpers
- TXID historical price lookup routed through internal cache first

### Exchange Foundation

- exchange connection schema
- portfolio-scoped exchange connection management page
- read-only connection profiles
- pause, reactivate, and remove actions

## In Progress

### Phase 2 - Portfolio Tracking Engine

The app is now inside the real portfolio engine phase, but the ingestion layer is still only partially complete.

Active areas:

- market-data hardening beyond the first cache layer
- exchange sync evolution from saved profile to real connector
- unified ledger expansion beyond manual, import, and TXID

### What is partially done, not finished

- wallet tracking
  - read-only preview exists
  - persistent sync into the ledger does not exist yet

- exchange sync
  - connection foundation exists
  - encrypted credentials, validation, and live sync do not exist yet

- market data
  - snapshot caching exists
  - scheduled refresh jobs and broader provider abstraction do not exist yet

## Next

These are the strongest next steps from the current state.

1. `Encrypted credential storage + first live exchange connector`
   Start with one exchange only and make the path real end to end.

2. `Wallet and exchange ingestion into the unified ledger`
   Convert synced balances and trades into normalized `source_records` and `ledger_entries`.

3. `Transfer detection and de-duplication`
   Prevent internal wallet and exchange transfers from being counted twice.

4. `Portfolio performance charts`
   Add value trend and allocation-over-time views once synced data is reliable enough.

## Later

These remain part of the roadmap, but they are not the right next move yet.

### Phase 3

- NFT tracking
- DeFi positions
- spam/scam token filtering
- risk and approvals scanner

### Phase 4

- alerts
- shareable portfolio links
- multiple language support
- donate in crypto

### Phase 5

- bring-your-own provider plugins
- in-product AI analyst

## Practical MVP Status

The current rebuild already covers a strong portion of the product MVP:

- auth
- multiple portfolios
- manual ledger
- TXID add
- import and export
- wallet tracking foundation
- exchange sync foundation
- internal price caching

The missing pieces before it becomes a stronger portfolio engine are:

- real exchange sync
- wallet sync persistence
- transfer-aware normalization
- performance charts

## Working Rule

For now, the team should prefer work that strengthens the core engine:

1. make data ingestion trustworthy
2. normalize everything into one ledger
3. reduce provider fragility
4. only then broaden into NFTs, DeFi, alerts, sharing, and AI
