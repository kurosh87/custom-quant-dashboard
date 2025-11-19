# Custom Quant Dashboard

Full‑stack demo that ingests TradingView signals into Supabase, mirrors the indicator logic from Pine Script, and renders multi‑timeframe analytics in a Next.js dashboard. This repo is prepped for interview demos, so everything you need—frontend, webhook server, CSV backfill script, and reproducible instructions—is contained here.

- GitHub: https://github.com/kurosh87/custom-quant-dashboard
- Tech stack: Next.js 16, Clerk auth (App Router), Tailwind/Shadcn UI, Express webhook server, Supabase (Postgres + Realtime).

## Features

- **Auth‑gated dashboard** – Template UI from Shadcn with Clerk authentication, reusable sidebar/header, and protected routes.
- **History view** – Multi‑timeframe (15m / 2h / 4h) tabs that read Supabase data with selectable columns (signal type, compression stats, jewel lines, BBWP, payload viewer).
- **Sentiment page** – Fear & Greed gauge + 30‑day history using the Alternative.me API with attribution.
- **Webhook → Supabase** – `/api/webhook/tradingview` validates secrets, derives compression/signal metrics (matching the Pine Script), and stores flattened rows.
- **CSV backfill** – `scripts/backfill-csv.js` streams TradingView exports, applies the same signal math, and seeds Supabase for demos.
- **Confluence API** – `/api/confluence/:symbol` aggregates the most recent signals per timeframe and scores compression alignment for future UI use.

## Local Setup

```bash
git clone https://github.com/kurosh87/custom-quant-dashboard.git
cd custom-quant-dashboard
npm install --workspaces=false   # or npm_config_workspaces=false npm install
```

Create `.env.local` (or copy `.env.example`) and populate:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

PORT=3001
TRADINGVIEW_WEBHOOK_SECRET=dev-secret

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
SUPABASE_SIGNALS_TABLE=signals
DEFAULT_HISTORY_SYMBOL=BTCUSDT

# CoinGecko market data (Fear & Greed / dominance cards)
COIN_GECKO_API_URL=https://api.coingecko.com/api/v3
COIN_GECKO_API_KEY=your-pro-api-key
```

### Supabase schema

Run this once (adds every column used by the webhook + backfill scripts):

```sql
create extension if not exists "uuid-ossp";

create table if not exists public.signals (
  id uuid primary key default uuid_generate_v4(),
  event_source text not null,
  symbol text,
  ticker text,
  direction text,
  price numeric,
  timestamp timestamptz,
  timeframe text,
  timeframe_minutes integer,
  ohlc_open numeric,
  ohlc_high numeric,
  ohlc_low numeric,
  ohlc_close numeric,
  ohlc_volume numeric,
  jewel_fast numeric,
  jewel_slow numeric,
  jewel_high numeric,
  jewel_fib numeric,
  bbwp_value numeric,
  bbwp_classification text,
  gaussian_filter numeric,
  gaussian_price_position numeric,
  gaussian_above_filter boolean,
  compression_total_range numeric,
  compression_center numeric,
  compression_fib_zone text,
  compression_nearest_fib_level numeric,
  compression_fib_cutting boolean,
  compression_extreme_compression boolean,
  compression_perfect_setup boolean,
  slope_fast numeric,
  slope_slow numeric,
  signal_type text,
  signal_strength numeric,
  signal_buy_score numeric,
  signal_sell_score numeric,
  raw_payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists idx_signals_symbol_timeframe
  on public.signals(symbol, timeframe, timestamp desc);

create index if not exists idx_signals_timeframe
  on public.signals(timeframe, timestamp desc);
```

## Running the apps

```bash
# 1. Frontend (Next.js + Clerk)
npm run dev

# 2. Webhook server (Express + Supabase client)
node server.js

# 3. Optional: expose the webhook
ngrok http 3001
```

Visit `http://localhost:3000/history` to see the tabs fed by Supabase, or `/sentiment` for the Fear & Greed view. The webhook logs to the console (timeframe, signal, compression stats) and inserts rows into `public.signals`.

## TradingView → Zapier → Webhook

1. **TradingView alert title**: `🎯 Jewel 15 - BTCUSDT` (change 15→120→240 for each timeframe). Include webhook payload as JSON (the Pine script already formats this).
2. **Zapier flow**:
   - Gmail trigger (new email)
   - Code by Zapier – parse subject/body to emit JSON + `timeframe` + `timeframeMinutes` (use the JavaScript snippet provided in your zap; it’s the same logic we used during setup).
   - Webhooks by Zapier → POST → `https://<your-ngrok>.ngrok-free.app/api/webhook/tradingview` (payload type `json`, headers `X-TradingView-Secret` = `TRADINGVIEW_WEBHOOK_SECRET`).
3. The backend validates the secret, derives the jewel/compression scores, and stores a normalized row in Supabase. `/api/confluence/:symbol` can then summarize the most recent 15m/2h/4h signals.

## CSV Backfill

Drop your TradingView CSV exports into the project root and run:

```bash
node scripts/backfill-csv.js "BINANCE_BTCUSDT, 15.csv" "BINANCE_BTCUSDT, 120.csv" "BINANCE_BTCUSDT, 240.csv"
```

The script streams each file, matches duplicate column names, computes compression/signal data via `lib/jewel-signals.js`, and inserts rows tagged with `event_source = "csv-backfill"`. This lets you demo the history tabs without waiting for live alerts.

## Deployment / Demo Tips

- Update `.env.production` (or your hosting provider secrets) with the same Supabase + Clerk keys before deploying.
- Use `ngrok` for live TradingView alerts during interviews; keep logs running to show the webhook + Supabase inserts in real time.
- The repo is ready to push to your fork:

```bash
git remote set-url origin https://github.com/kurosh87/custom-quant-dashboard.git
git push origin main
```

Feel free to fork/trim this README to match your interview narrative. Good luck!
