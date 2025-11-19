#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const { computeJewelSignals } = require("../lib/jewel-signals");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH_SIZE = 1000;
const TIMEFRAME_LABELS = {
  15: "15m",
  60: "1h",
  120: "2h",
  240: "4h",
};

const files = process.argv.slice(2);
if (!files.length) {
  console.error(
    "Usage: node scripts/backfill-csv.js \"BINANCE_BTCUSDT, 15.csv\" ..."
  );
  process.exit(1);
}

async function processFile(filePath) {
  const meta = parseFileMeta(filePath);
  console.log(`\n🚀 Processing ${filePath}`);
  console.log(
    `   Symbol: ${meta.symbol} | Timeframe: ${meta.timeframeLabel} (${meta.timeframeMinutes}m)`
  );

  return new Promise((resolve, reject) => {
    const headerCounts = {};
    const buffer = [];
    let inserted = 0;
    let rowCount = 0;
    let firstTimestamp = null;
    let lastTimestamp = null;

    const flush = async () => {
      if (!buffer.length) return;

      const batch = buffer.splice(0, buffer.length);
      const { error } = await supabase.from("signals").insert(batch);
      if (error) {
        console.error("❌ Supabase insert error:", error.message);
        throw error;
      }
      inserted += batch.length;
    };

    const stream = fs
      .createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => {
            const key = header.trim().replace(/\s+/g, "_").toLowerCase();
            headerCounts[key] = (headerCounts[key] || 0) + 1;
            return headerCounts[key] > 1
              ? `${key}_${headerCounts[key]}`
              : key;
          },
        })
      )
      .on("data", async (row) => {
        stream.pause();
        rowCount += 1;
        try {
          const record = transformRow(row, meta);
          if (record) {
            buffer.push(record);
            firstTimestamp = firstTimestamp || record.timestamp;
            lastTimestamp = record.timestamp;
          }
          if (buffer.length >= BATCH_SIZE) {
            await flush();
          }
        } catch (err) {
          console.error(
            `⚠️  Row ${rowCount} skipped (${err.message || err})`
          );
        } finally {
          stream.resume();
        }
      })
      .on("end", async () => {
        try {
          await flush();
          console.log("📊 Rows parsed:", rowCount);
          console.log("🕒 First timestamp:", firstTimestamp);
          console.log("🕒 Last timestamp:", lastTimestamp);
          console.log("✅ Inserted:", inserted);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

function parseFileMeta(filePath) {
  const base = path.basename(filePath);
  const match = base.match(/^[^_]+_([A-Z0-9]+),\s*(\d+)\.csv$/i);
  if (!match) {
    throw new Error(`Unable to parse symbol/timeframe from ${base}`);
  }
  const [, symbol, timeframe] = match;
  const timeframeMinutes = Number(timeframe);
  const timeframeLabel =
    TIMEFRAME_LABELS[timeframeMinutes] || `${timeframeMinutes}m`;
  return { symbol, timeframeMinutes, timeframeLabel };
}

function transformRow(row, meta) {
  const timestamp = toNumber(row.time);
  if (!timestamp) {
    throw new Error("Invalid timestamp");
  }

  const price = toNumber(row.close);
  const open = toNumber(row.open);
  const high = toNumber(row.high);
  const low = toNumber(row.low);
  const volume = toNumber(row.ohlc_volume) ?? null;

  const fast = firstAvailable(row.fast_2, row.fast);
  const slow = firstAvailable(row.slow_2, row.slow);
  const highJewel = firstAvailable(row.high_3, row.high_2, row.high);
  const fib = firstAvailable(row.fib_2, row.fib);

  if (fast === null || slow === null || highJewel === null) {
    throw new Error("Missing jewel readings");
  }

  const baseSignal = deriveSignal(row);
  const derived = computeJewelSignals({
    fast,
    slow,
    high: highJewel,
    fib,
    bbwp: toNumber(row.bbwp),
    slopeFast: null,
    slopeSlow: null,
    signalType: baseSignal.type,
    signalStrength: baseSignal.strength,
  });

  const timestampIso = new Date(timestamp * 1000).toISOString();

  return {
    event_source: "csv-backfill",
    symbol: meta.symbol,
    ticker: meta.symbol,
    direction: derived.signalType || baseSignal.type,
    price,
    timestamp: timestampIso,
    timeframe: meta.timeframeLabel,
    timeframe_minutes: meta.timeframeMinutes,
    ohlc_open: open,
    ohlc_high: high,
    ohlc_low: low,
    ohlc_close: price,
    ohlc_volume: volume,
    jewel_fast: fast,
    jewel_slow: slow,
    jewel_high: highJewel,
    jewel_fib: fib,
    bbwp_value: derived.bbwpValue ?? toNumber(row.bbwp),
    bbwp_classification: derived.bbwpClassification,
    gaussian_filter: null,
    gaussian_price_position: null,
    gaussian_above_filter: null,
    compression_total_range: derived.compressionTotalRange,
    compression_center: derived.compressionCenter,
    compression_fib_zone: derived.compressionFibZone,
    compression_nearest_fib_level: derived.nearestFibLevel ?? fib,
    compression_fib_cutting: derived.fibCutting,
    compression_extreme_compression: derived.extremeCompression,
    compression_perfect_setup: derived.perfectSetup ?? toBoolean(row.perfect_setup),
    slope_fast: null,
    slope_slow: null,
    signal_type: derived.signalType || baseSignal.type,
    signal_strength: derived.signalStrength || baseSignal.strength,
    signal_buy_score: derived.buyScore,
    signal_sell_score: derived.sellScore,
    raw_payload: row,
    received_at: new Date().toISOString(),
  };
}

function deriveSignal(row) {
  if (toBoolean(row.god_buy)) return { type: "GOD_BUY", strength: 5 };
  if (toBoolean(row.god_sell)) return { type: "GOD_SELL", strength: 5 };
  if (toBoolean(row.ultra_buy)) return { type: "ULTRA_BUY", strength: 4 };
  if (toBoolean(row.ultra_sell)) return { type: "ULTRA_SELL", strength: 4 };
  return { type: null, strength: null };
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toBoolean(value) {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value).trim();
  if (str === "1" || str.toLowerCase() === "true") return true;
  if (str === "0" || str.toLowerCase() === "false") return false;
  return null;
}

function firstAvailable(...values) {
  for (const value of values) {
    const num = toNumber(value);
    if (num !== null) return num;
  }
  return null;
}

(async () => {
  for (const file of files) {
    try {
      await processFile(path.resolve(file));
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message || error);
      process.exit(1);
    }
  }
  console.log("\n🎉 Backfill completed for all files.");
})();
