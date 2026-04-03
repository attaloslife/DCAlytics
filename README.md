# DCAlytics

A lightweight browser-first crypto tracking interface for recording transactions locally.

## Planning Docs

- [Build Spec](./docs/BUILD_SPEC.md)
- [Progress Tracker](./docs/PROGRESS_TRACKER.md)

## Rebuild Scaffold

The repository now contains the first `M1 - Foundation Shell` scaffold for the rebuild:

- `apps/web`: Next.js-style web app shell for the new product
- `packages/*`: shared workspace packages for domain, auth, db, providers, ledger, UI, config, crypto, and i18n
- `packages/db/supabase`: initial migration and seed location for the new database-backed app

The original browser prototype is still kept at the repo root for reference:

- [index.html](./index.html)
- [app.js](./app.js)
- [styles.css](./styles.css)

## Current Build Status

The active product work is now in the rebuilt web app under `apps/web`.

Current completed foundations include:

- authenticated web app shell
- multiple portfolios
- database-backed ledger and trade log
- manual transactions and TXID review flow
- import and export
- wallet tracking foundation with live preview
- exchange sync foundation
- internal spot and historical price caching

The original browser prototype at the repo root is still available as a reference, but it is no longer the main build target.

## Run locally

For the legacy prototype, open [index.html](./index.html) in your browser.

For the rebuilt web app, run the workspace app from the repo root:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run dev --workspace @dcalytics/web
```
