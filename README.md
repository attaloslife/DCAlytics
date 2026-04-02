# DCAlytics

A lightweight browser-first crypto tracking interface for recording transactions locally.

## Planning Docs

- [Build Spec](./docs/BUILD_SPEC.md)

## Rebuild Scaffold

The repository now contains the first `M1 - Foundation Shell` scaffold for the rebuild:

- `apps/web`: Next.js-style web app shell for the new product
- `packages/*`: shared workspace packages for domain, auth, db, providers, ledger, UI, config, crypto, and i18n
- `packages/db/supabase`: initial migration and seed location for the new database-backed app

The original browser prototype is still kept at the repo root for reference:

- [index.html](./index.html)
- [app.js](./app.js)
- [styles.css](./styles.css)

## Current structure

- `Dashboard`: placeholder page for the portfolio overview we will design later.
- `Add Transaction`: capture buy and sell trades with auto-calculated risk.
- `Trade Log`: table view of saved transactions from browser local storage.

## Run locally

Open [index.html](./index.html) in your browser.

There is no backend yet. Transactions are stored in the browser using `localStorage`.
