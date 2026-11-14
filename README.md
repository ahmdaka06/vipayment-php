# VIPayment Rust SDK

[![Crates.io](https://img.shields.io/badge/crates.io-v0.1.0-orange.svg)](https://crates.io/crates/vipayment)
[![Documentation](https://docs.rs/vipayment/badge.svg)](https://docs.rs/vipayment)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official-style Rust SDK for [VIPayment / VIP Reseller](https://vip-reseller.co.id) API integration.

Provides both **asynchronous** (Tokio + Reqwest) and **synchronous (blocking)** clients for managing account balance, prepaid transactions (PLN, Pulsa, data), game top-ups, order statuses, and catalog services.

---

## Features

- ⚡ **Async-First**: Built with `reqwest` and `tokio` for high performance and low resource overhead.
- 🔒 **Type-Safe**: Complete typed models for all requests and responses, with resilient fallback (`ApiResponse<T>`).
- 🔐 **Automated Signatures**: MD5 signature (`md5(api_id + api_key)`) generated and attached automatically.
- 🛡️ **Blocking Support**: Optional `blocking` feature flag for non-async applications and simple scripts.
- 📦 **Zero External Server Needed for Testing**: Mock integration tests using `wiremock`.
- 💻 **Cross-Platform CLI**: Built-in `vipayment` CLI with automated multi-OS release builds (Linux, Windows, macOS).

---

## Pre-built Binaries

Pre-compiled standalone executables are automatically generated on every push for:
- **Windows (x64)**: `vipayment-x86_64-pc-windows-msvc.zip`
- **Linux (glibc / Ubuntu/Debian)**: `vipayment-x86_64-unknown-linux-gnu.tar.gz`
- **Linux (musl / Alpine/Docker)**: `vipayment-x86_64-unknown-linux-musl.tar.gz`
- **macOS Apple Silicon (M1/M2/M3/M4)**: `vipayment-aarch64-apple-darwin.tar.gz`
- **macOS Intel (x86_64)**: `vipayment-x86_64-apple-darwin.tar.gz`

Download the latest release package from [GitHub Releases](https://github.com/teguh2910/vipayment-rust/releases).

---

## Command-Line Interface (CLI)

The package includes a standalone CLI binary:

```bash
# Set credentials
export VIPAYMENT_API_ID="your_api_id"
export VIPAYMENT_API_KEY="your_api_key"

# Show help
vipayment help

# Check balance & profile
vipayment profile

# Query prepaid services catalog
vipayment prepaid-services type pulsa-reguler

# Order prepaid service
vipayment prepaid-order PLN5 1234567890

# Check order status
vipayment prepaid-status TRX123456789

# Query game catalog
vipayment game-services "Mobile Legends" available

# Order game top-up
vipayment game-order ML5 12345678 1234
```

---

## Installation

Add `vipayment` to your `Cargo.toml`:

```toml
[dependencies]
vipayment = "0.1.0"
tokio = { version = "1", features = ["full"] }
```

### Synchronous (Blocking) Mode

If you do not use Tokio or async Rust, enable the `blocking` feature:

```toml
[dependencies]
vipayment = { version = "0.1.0", features = ["blocking"] }
```

---

## Quickstart

### 1. Initialization

```rust
use vipayment::VipaymentClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let api_id = "your_api_id";
    let api_key = "your_api_key";

    let client = VipaymentClient::new(api_id, api_key);

    // Or configure with custom options (timeout, proxy, base URL)
    // let client = VipaymentClient::builder(api_id, api_key)
    //     .timeout(std::time::Duration::from_secs(30))
    //     .build()?;

    Ok(())
}
```

### 2. Get Profile & Balance

```rust
let response = client.profile().await?;

if response.is_success() {
    let profile = response.into_result()?;
    println!("Username: {:?}", profile.username);
    println!("Balance: {:?}", profile.balance);
} else {
    eprintln!("Error: {}", response.message);
}
```

---

## Prepaid Services (Pulsa, PLN, Data)

### Query Prepaid Services Catalog

```rust
// Fetch all services
let all_services = client.service_prepaid(None, None).await?;

// Filter by type (e.g., 'pulsa-reguler')
let pulsa = client.service_prepaid(Some("type"), Some("pulsa-reguler")).await?;

if let Ok(services) = pulsa.into_result() {
    for service in services {
        println!("[{}] {:?} - {:?}", 
            service.code.as_deref().unwrap_or("-"),
            service.name, 
            service.price
        );
    }
}
```

### Order Prepaid Service

```rust
let order = client.order_prepaid("PLN5", "1234567890").await?;

if order.is_success() {
    let data = order.into_result()?;
    println!("Order Placed! Transaction ID: {:?}", data.trxid);
} else {
    eprintln!("Order failed: {}", order.message);
}
```

### Check Prepaid Order Status

```rust
let status = client.status_order_prepaid("TRX123456789", None).await?;

if let Ok(records) = status.into_result() {
    for record in records {
        println!("Status: {:?}, SN: {:?}", record.status, record.sn);
    }
}
```

---

## Game & Streaming Top-up

### Query Game Catalog

```rust
// Filter by game and availability
let games = client.service_game(Some("Mobile Legends"), Some("available")).await?;

if let Ok(items) = games.into_result() {
    for item in items {
        println!("[{}] {:?} - {:?}", item.code, item.name, item.price);
    }
}
```

### Order Game Top-up

```rust
// service_code, user_id, zone_id (optional)
let order = client.order_game("ML5", "12345678", Some("1234")).await?;

if order.is_success() {
    let data = order.into_result()?;
    println!("Game Order Placed! TrxID: {:?}", data.trxid);
}
```

### Check Game Order Status

```rust
let status = client.status_order_game("TRX987654321", None).await?;

if let Ok(records) = status.into_result() {
    for record in records {
        println!("Game Status: {:?}, SN: {:?}", record.status, record.sn);
    }
}
```

---

## Synchronous (Blocking) Usage

```rust
#[cfg(feature = "blocking")]
use vipayment::blocking::BlockingVipaymentClient;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = BlockingVipaymentClient::new("your_api_id", "your_api_key");

    let profile = client.profile()?;
    println!("Profile: {:?}", profile.data);

    let services = client.service_prepaid(Some("type"), Some("pulsa-reguler"))?;
    println!("Services: {:?}", services.data);

    Ok(())
}
```

---

## Running Examples

Set your credentials as environment variables (optional):

```bash
export VIPAYMENT_API_ID="your_api_id"
export VIPAYMENT_API_KEY="your_api_key"
```

Then run any of the provided examples:

```bash
cargo run --example 01_profile
cargo run --example 02_prepaid
cargo run --example 03_game
```

---

## Running Tests

Run the full automated test suite with WireMock:

```bash
cargo test --all-features
```

---

## Web Top-Up App (`apps/*` + `web`)

This repository also ships a self-hosted web top-up app built on top of the SDK.
The backend is split into small services behind a single public gateway:

```
web/ (React SPA) ──►  gateway :8080  ──┬──►  catalog-service :8081  (catalog.db, logos)
   /api/v1/*                          ├──►  order-service   :8082  (orders.db, uploads)
   /uploads/*                         └──►  fulfillment-service :8083  (stateless)
   /logos/*                                     └──► VIP Reseller API (via the SDK)
```

| Crate | Binary | Owns |
| --- | --- | --- |
| `apps/shared` | — | provider client, errors, status enums, helpers, internal auth |
| `apps/gateway` | `vipayment-gateway` | public `/api/v1`, `/uploads`, `/logos`; CORS; admin auth; health aggregation |
| `apps/catalog-service` | `vipayment-catalog` | catalog sync, pricing/margins, logo cache, `/games` |
| `apps/order-service` | `vipayment-order` | orders, payments, invoices, uploads, expiry/simulation worker |
| `apps/fulfillment-service` | `vipayment-fulfillment` | submits paid orders to the provider and polls status |
| `apps/migrate` | `vipayment-migrate` | one-off migration from the old monolithic database |

Service-to-service calls use `INTERNAL_TOKEN` (`x-internal-token`); browser
traffic only ever reaches the gateway, so the public API surface is unchanged.

### What it does

- Syncs the full provider catalog into SQLite every 30 minutes:
  - `/game-feature` groups (games, apps, streaming, vouchers) — 98 groups;
  - `/prepaid` groups (pulsa, paket data, telepon, PLN, e-wallet, TV, voucher) grouped by type + brand.
  `MARKUP_PERCENT` is applied to every product, with optional per-category
  overrides through `MARKUP_BY_CATEGORY`. Provider prices arrive as tier objects
  (`{"basic": ..., "premium": ..., "special": ...}`); the `basic` tier is used as
  the cost basis.
- Guest checkout for every category: pick a product, fill the target (game ID + zone, phone number, or meter number), receive an invoice.
- Pluggable payment adapter:
  - `manual` — static QRIS / bank transfer, customer uploads proof, admin approves it.
  - `simulation` — payment is auto-confirmed after a few seconds (local testing, no real money).
- Once payment is confirmed, a background worker submits the order to the right provider endpoint (`/game-feature` for game/app groups, `/prepaid` for prepaid groups), polls its status, and stores the serial number.
- Invoice tracking page, admin review panel, and a status timeline.
- Group logos are resolved from the official game/brand website (Google favicon service), downloaded once during sync, and served locally from `/logos/...` — nothing is hotlinked from a third party. Groups without a mapped domain fall back to an initials tile.

The provider API key never reaches the browser, and order prices are always read from the database (never from the client).

### Quick start

```bash
# 1. Configure every service (the provided .env files are gitignored).
#    INTERNAL_TOKEN must be identical in catalog, order, and fulfillment.
cp apps/gateway/.env.example apps/gateway/.env
cp apps/catalog-service/.env.example apps/catalog-service/.env
cp apps/order-service/.env.example apps/order-service/.env
cp apps/fulfillment-service/.env.example apps/fulfillment-service/.env
# then edit them: provider credentials, ADMIN_TOKEN, INTERNAL_TOKEN, payment mode

# 2. Run each backend service (paths are relative to its crate directory)
(cd apps/catalog-service && cargo run)      # :8081
(cd apps/order-service && cargo run)        # :8082
(cd apps/fulfillment-service && cargo run)  # no listener, background worker
(cd apps/gateway && cargo run)              # :8080

# 3. Run the web app (point it at the gateway)
cd web
npm install
VITE_API_URL=http://127.0.0.1:8080 npm run dev
# open http://localhost:3000  (admin: http://localhost:3000/admin)
```

Running a single command per service is easiest with Compose (below); the
services are independent binaries and can be started in any order.

### Using the API from another frontend

Any other web app can use the same backend: the gateway is the only public
entry point, and every `/api/v1/*` route is unchanged.

Complete request/response schemas, error codes, status lifecycle, TypeScript
examples, and the full deploy guide for `https://vipsdk.ttmi.my.id` are in
**[integration.md](integration.md)**. A ready-to-use nginx config lives in
`deploy/nginx/vipsdk.ttmi.my.id.conf`. The short version:

1. **Allow its origin.** Browser calls are gated by CORS, so add the new site to
   `WEB_ORIGIN` (comma-separated; a trailing slash is stripped):

   ```dotenv
   WEB_ORIGIN=https://shop.example.com,https://admin.example.com
   # or, to let any website call the API (still no credentials/cookies):
   # WEB_ORIGIN=*
   ```

   Restart the gateway afterwards. Startup logs print the active list and
   `allow_any_origin`.

2. **Point the frontend at the gateway.** Base URL is the gateway origin, and
   the API prefix is `/api/v1`:

   ```js
   // Browser example
   const API_BASE = "https://api.example.com";
   await fetch(`${API_BASE}/api/v1/games`);

   // Create an order (prices always come from the server)
   await fetch(`${API_BASE}/api/v1/orders`, {
     method: "POST",
     headers: { "content-type": "application/json" },
     body: JSON.stringify({
       game_slug: "mobile-legends",
       product_code: "ML86",
       user_id: "12345678",
       zone: "1234",
       contact: "081234567890",
     }),
   });
   ```

3. **Reach it from outside Docker.** Only the gateway publishes a host port
   (`127.0.0.1:8089` in Compose). For a real domain, put nginx/Caddy in front of
   it and forward `/api/v1/`, `/uploads/`, and `/logos/` to the gateway — the
   storefront, invoice pages, proof uploads, and logos all live under those
   three prefixes. Serve it over HTTPS, otherwise browsers treat the API as
   mixed content on an HTTPS page.

Admin endpoints need `Authorization: Bearer <ADMIN_TOKEN>`. Never ship that
token in client-side code; call admin routes from your own server or an
authenticated dashboard only.

Note that a `*` allowlist does **not** let other sites act as an admin: the
gateway requires the bearer token for `/api/v1/admin/*`, and CORS does not
enable credentials. Still, prefer an explicit list in production.

> **IP allowlist:** VIP Reseller only accepts requests from allowlisted IPs. Add
> your server's public IP in the VIP Reseller dashboard first. Otherwise catalog
> sync and orders fail with `IP ... tidak diizinkan` (visible in
> `GET /api/v1/health` as `last_sync_error`).

### Docker

The repository ships a Compose setup with five backend services plus the web app:

| File | Purpose |
| --- | --- |
| `Dockerfile.service` | Shared multi-stage Rust build; `SERVICE_BIN`/`SERVICE_PORT` build args; runs as a non-root user on `debian:bookworm-slim` |
| `web/Dockerfile` | Vite build of the React SPA, served as static files by `nginx:alpine` |
| `docker-compose.yml` | `gateway` on `:8089`, `catalog`/`order`/`fulfillment` internal only, `web` on `127.0.0.1:3001`, volumes `catalog-data` + `order-data` |

```bash
# 1. Service environments (provider credentials, ADMIN_TOKEN, payment mode)
cp apps/gateway/.env.example apps/gateway/.env
cp apps/catalog-service/.env.example apps/catalog-service/.env
cp apps/order-service/.env.example apps/order-service/.env
cp apps/fulfillment-service/.env.example apps/fulfillment-service/.env
# INTERNAL_TOKEN and ADMIN_TOKEN are read from the shell/Compose environment,
# so export the same values you put in the .env files:
export INTERNAL_TOKEN='change-me-internal-token-min-16-chars'
export ADMIN_TOKEN='change-me'

# 2. Build and start
docker compose up --build -d

# 3. Open
# storefront  http://localhost:3001
# admin       http://localhost:3001/admin
# api health  http://localhost:8089/api/v1/health
```

Only the `gateway` publishes a host port (`127.0.0.1:8089`); `catalog`, `order`,
and `fulfillment` are reachable only inside the Compose network. The gateway
binds `0.0.0.0:8080` in the container (Compose overrides `BIND_ADDR`, which is
`127.0.0.1` for local `cargo run`). Catalog data lives in the `catalog-data`
volume, orders and payment proofs in `order-data`:

```bash
docker compose logs -f gateway catalog order fulfillment web   # follow logs
docker compose ps                                              # service status
docker compose down                                            # stop (keeps volumes)
docker compose down -v                                         # stop and delete data
```

`VITE_API_URL` is inlined into the browser bundle at build time, so it must be
the URL the **browser** can reach (not a container hostname). Override it when
building for a real domain:

```bash
VITE_API_URL=https://api.example.com docker compose build web
VITE_API_URL=https://api.example.com docker compose up -d
```

For a public deployment also set `WEB_ORIGIN` in `apps/gateway/.env` to the
public storefront URL (CORS allowlist), set strong `ADMIN_TOKEN` and
`INTERNAL_TOKEN` values (behind a reverse proxy, do not publish 8081-8083),
switch `apps/order-service/.env` to `PAYMENT_PROVIDER=manual` with real
QRIS/bank accounts, and make sure the provider allowlist includes the server's
public IP.

### Logos missing after deploying

Group logos are downloaded by the **catalog service** during a catalog sync and
cached in `LOGO_DIR`. Check these in order:

1. **Is the new catalog service deployed?** `GET /api/v1/health` must include
   `"logos_cached"`. If the field is missing, the running image predates the logo
   feature: `git pull && docker compose up -d --build`.
2. **Did the sync cache anything?** `logos_cached` should be greater than zero
   (up to ~56 unique domains). If it is `0`, inspect
   `docker compose logs catalog | grep -i logo`:
   - `logo download failed (check server egress)` — the server cannot reach
     `https://www.google.com/s2/favicons`; allow outbound HTTPS.
   - `cannot create logo directory` / `cannot write logo file` — `LOGO_DIR` is
     not writable. With a bind mount: `chown -R 10001:10001 ./data` (the API runs
     as UID 10001).
3. **Does `/games` return `icon_url`?** If it is `null` for every group, the sync
   has not cached logos (see step 2). If it returns `/logos/...`, open
   `https://<api-host>/logos/<file>` directly: a 404 means the reverse proxy does
   not forward `/logos/` (and `/uploads/`) to the API.
4. **Was the storefront built with the public API URL?**
   `VITE_API_URL` is inlined into the browser bundle. If it is still
   `http://localhost:8080`, a remote browser requests logos from its own machine.
   Rebuild: `VITE_API_URL=https://api.example.com docker compose build web`.

The admin **Katalog & saldo** tab also reports the number of logos stored by the
last manual sync.

### Configuration

Each service reads its own `.env` (see the `.env.example` next to it).

**Gateway** (`apps/gateway/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `BIND_ADDR` | `127.0.0.1:8080` | public listen address |
| `WEB_ORIGIN` | `http://localhost:3000` | comma-separated CORS allowlist, or `*` for any origin |
| `ADMIN_TOKEN` | required | `Authorization: Bearer <token>` for `/api/v1/admin/*` |
| `CATALOG_SERVICE_URL` | `http://127.0.0.1:8081` | catalog service base URL |
| `ORDER_SERVICE_URL` | `http://127.0.0.1:8082` | order service base URL |

**Catalog service** (`apps/catalog-service/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `BIND_ADDR` | `127.0.0.1:8081` | internal listen address |
| `DATABASE_URL` | `sqlite://data/catalog.db` | catalog SQLite file |
| `INTERNAL_TOKEN` | required | service-to-service shared secret |
| `PROVIDER_VIPRESELLER_ENABLED` | `true` | `false` stops catalog refreshes |
| `PROVIDER_VIPRESELLER_API_ID` / `_API_KEY` | required | falls back to `VIPAYMENT_API_ID` / `VIPAYMENT_API_KEY` |
| `PROVIDER_VIPRESELLER_SIGN` | optional | checked against `md5(API_ID + API_KEY)`; the SDK recomputes it |
| `PROVIDER_VIPRESELLER_BASE_URL` | `https://vip-reseller.co.id/api` | point at a mock for testing |
| `PROVIDER_TIMEOUT_SECONDS` | `20` | provider request timeout |
| `PROVIDER_FORCE_IPV4` | `true` | bind outbound requests to IPv4 (use when only the IPv4 is allowlisted) |
| `MARKUP_PERCENT` | `5` | default margin for every category |
| `MARKUP_BY_CATEGORY` | empty | JSON map of per-category percentages |
| `MARKUP_FIXED_BY_CATEGORY` | empty | JSON map of per-category rupiah margins |
| `CATALOG_CATEGORIES` | all | comma-separated category allowlist for the storefront |
| `GAMES_CONFIG_PATH` | `config/games.json` | optional game metadata overrides |
| `LOGOS_CONFIG_PATH` | `config/logos.json` | group/brand → official domain mapping |
| `LOGO_DIR` | `data/logos` | cached logo files served at `/logos` |

**Order service** (`apps/order-service/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `BIND_ADDR` | `127.0.0.1:8082` | internal listen address |
| `DATABASE_URL` | `sqlite://data/orders.db` | orders SQLite file |
| `UPLOAD_DIR` | `data/uploads` | payment proofs served at `/uploads` |
| `CATALOG_SERVICE_URL` | `http://127.0.0.1:8081` | used to resolve prices at checkout |
| `INTERNAL_TOKEN` | required | must match the catalog and fulfillment services |
| `ADMIN_TOKEN` | required | re-validated here; must match the gateway |
| `PAYMENT_PROVIDER` | `manual` | `manual` or `simulation` |
| `PAYMENT_EXPIRY_MINUTES` | `1440` | invoice payment window |
| `SIMULATION_AUTO_PAY_SECONDS` | `5` | simulation mode only |
| `MAX_ORDER_AMOUNT` | `10000000` | upper bound for a single order |
| `MANUAL_QRIS_IMAGE_URL` | empty | optional QRIS image URL |
| `MANUAL_BANK_ACCOUNTS` | empty | JSON array, single-quoted in `.env` |

**Fulfillment service** (`apps/fulfillment-service/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `ORDER_SERVICE_URL` | `http://127.0.0.1:8082` | claim/report endpoints |
| `INTERNAL_TOKEN` | required | must match the order service |
| `POLL_INTERVAL_SECONDS` | `10` | how often a paid order is claimed |
| `FULFILLMENT_ENABLED` | `true` | `false` exits without submitting |
| `PROVIDER_VIPRESELLER_*` | — | same provider variables as the catalog service |

### Pricing and margins

`MARKUP_PERCENT` is the default margin for every group. Override it per category
with `MARKUP_BY_CATEGORY` (JSON object, single-quoted in `.env`):

```dotenv
MARKUP_PERCENT=5
MARKUP_BY_CATEGORY='{"game": 7, "app": 10, "pulsa-reguler": 4, "token-pln": 3}'
```

Valid keys are `game`, `app`, and the prepaid provider types:
`pulsa-reguler`, `pulsa-transfer`, `pulsa-internasional`, `paket-internet`,
`paket-telepon`, `paket-lainnya`, `saldo-emoney`, `token-pln`, `streaming-tv`,
`voucher-game`. Unknown keys are ignored and missing keys fall back to
`MARKUP_PERCENT`. Prices are rounded up to the next rupiah.

For pulsa and PLN tokens you can use a **fixed rupiah margin** instead of a
percentage:

```dotenv
MARKUP_FIXED_BY_CATEGORY='{"pulsa-reguler": 500, "pulsa-transfer": 500, "pulsa-internasional": 1000, "token-pln": 1000}'
```

A fixed margin takes precedence over a percentage for the same category
(`sell = base + margin`). Rupiah margins are capped at 1,000,000.

Margins are applied during a catalog sync. After editing `.env`, restart the API
and trigger a sync (admin **Katalog & saldo** → **Sync sekarang**) or wait up to
30 minutes. The admin tab shows the active default and per-category margins.

### Product scope

`CATALOG_CATEGORIES` limits which categories can be sold. It is a
comma-separated allowlist of category slugs; when unset, every category is
available. Groups whose category is not listed are hidden from `/games`, their
product pages return 404, ordering them is rejected, and a catalog sync skips
them. Game and app/voucher groups have no prepaid category, so setting an
allowlist hides them automatically.

```dotenv
# Only pulsa, data packages, and PLN tokens
CATALOG_CATEGORIES=pulsa-reguler,pulsa-transfer,pulsa-internasional,paket-internet,paket-telepon,paket-lainnya,token-pln
```

`config/games.json` is **optional metadata overrides** for game groups (display
name, slug, icon, zone requirement, input labels, sort order). All groups are
discovered from the provider; a game without an override gets a generated slug,
and any game group that is not listed there still accepts an optional
zone/server field. Provider group names removed from the response are
deactivated on the next sync (their historical orders stay intact).

`config/logos.json` maps a provider group name (or prepaid brand) to its official
website domain, for example `"Mobile Legends B": "mobilelegends.com"`. During a
sync the API downloads the site icon once, caches it under `LOGO_DIR`
(`data/logos`), and serves it from `GET /logos/{slug}.png`. Groups without a
mapping keep the initials tile. To refresh a logo, edit the mapping and delete
the cached file, then run `POST /api/v1/admin/sync-products`.

### API surface

All of this goes through the gateway; the split is invisible to clients.

Public (`/api/v1`): `GET /health`, `GET /games`, `GET /games/{slug}/products`,
`GET /orders/lookup`, `POST /orders`, `GET /orders/{invoice}`,
`POST /orders/{invoice}/payment-proof`.

Admin (Bearer `ADMIN_TOKEN`): `GET /admin/payments`, `POST /admin/payments/{invoice}/approve`,
`POST /admin/payments/{invoice}/reject`, `GET /admin/orders`, `POST /admin/orders/{invoice}/retry`,
`POST /admin/orders/{invoice}/refunded`, `POST /admin/sync-products`, `GET /admin/profile`.

Internal (service only, `x-internal-token`): `GET /internal/catalog/resolve/{slug}/{code}`
on the catalog service; `POST /internal/orders/claim`, `GET /internal/orders/pollable`, and
`POST /internal/orders/{invoice}/{submitted|rejected|failed|status}` on the order service.

Order lifecycle: `pending_payment → paid → submitting → processing → success`
(with `failed` / `refund_pending` / `refunded` / `expired` / `needs_attention` branches).
The lease (`submission_lease_until`) still lives in `orders.db`, so the
fulfillment service submits each paid order exactly once even if several
instances run.

### Migrating from the monolithic database

The old single `data/app.db` is not read by the services. Copy it aside and run
the migration tool, which splits it into `catalog.db` and `orders.db`:

```bash
SOURCE_DATABASE_URL=sqlite://data/app.db \
CATALOG_DATABASE_URL=sqlite://data/catalog.db \
ORDERS_DATABASE_URL=sqlite://data/orders.db \
cargo run -p vipayment-migrate
```

It opens the source read-only, backfills the denormalized `game_*` columns on
orders, and exits non-zero if any row count differs from the source. The source
file is left untouched, so keep it as a backup.

### Testing

```bash
cargo test --workspace             # SDK + all services
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo fmt --all -- --check
cd web && npm run build            # typecheck + production build
```

Auth can be checked against a running deployment with `./scripts/test-auth.sh <base-url> <admin-token>`
(public endpoints 200, admin without/with wrong token 401, valid token 200).

The wiring that matters most is covered end to end: `apps/order-service/tests/order_flow.rs`
drives checkout against a mocked catalog, and
`apps/fulfillment-service/tests/fulfillment.rs` proves a paid order is submitted
exactly once and that provider rejections become refund cases.

---

## License

This project is licensed under the [MIT License](LICENSE).
