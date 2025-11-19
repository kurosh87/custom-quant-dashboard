const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { computeJewelSignals } = require("./lib/jewel-signals");

/**
 * Load environment variables. We pull from both `.env.local` and `.env`
 * so the backend can reuse the same config as the Next.js app.
 */
const envLocalPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envLocalPath, override: false });
dotenv.config();

const PORT = Number(process.env.PORT || 3001);
const TRADINGVIEW_WEBHOOK_SECRET = process.env.TRADINGVIEW_WEBHOOK_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_SIGNALS_TABLE =
  process.env.SUPABASE_SIGNALS_TABLE || "signals";

// Initialize Supabase client when credentials exist.
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const app = express();

app.use(express.json({ limit: "1mb" }));

/**
 * Simple request logger so webhook/health hits are visible in the console.
 */
app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
  );
  next();
});

app.get("/health", (_req, res) => {
  const healthy = Boolean(supabase);
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabaseConfigured: healthy,
    webhookPath: "/api/webhook/tradingview",
  });
});

app.post("/api/webhook/tradingview", async (req, res) => {
  if (!TRADINGVIEW_WEBHOOK_SECRET) {
    return res.status(500).json({
      error: "TradingView secret missing",
      message:
        "Set TRADINGVIEW_WEBHOOK_SECRET in your .env.local file to accept requests.",
    });
  }

  const providedSecret =
    req.headers["x-tradingview-secret"] ||
    req.body?.secret ||
    req.body?.token;

  if (providedSecret !== TRADINGVIEW_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabase) {
    return res.status(500).json({
      error: "Supabase credentials missing",
      message:
        "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before receiving webhooks.",
    });
  }

  const payload = req.body;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  if (!payload.timeframe || !payload.timeframeMinutes) {
    console.error("Missing timeframe in payload", payload.timeframe);
    return res.status(400).json({
      error: "Missing timeframe",
      message: "Include timeframe and timeframeMinutes in the webhook payload.",
    });
  }

  const timeframeMinutes = Number(payload.timeframeMinutes);
  if (!Number.isFinite(timeframeMinutes)) {
    return res.status(400).json({
      error: "Invalid timeframeMinutes",
      message: "timeframeMinutes must be a number of minutes.",
    });
  }

  const parsedTimestamp = new Date(payload.timestamp || Date.now());
  if (Number.isNaN(parsedTimestamp.getTime())) {
    return res.status(400).json({
      error: "Invalid timestamp",
      message: "timestamp must be a valid date or unix time.",
    });
  }

  console.log("\n📨 ===== NEW WEBHOOK RECEIVED =====");
  console.log(
    `⏰ Timeframe: ${payload.timeframe} (${timeframeMinutes} minutes)`
  );
  console.log("📊 Symbol:", payload.symbol);
  console.log("🎯 Signal:", payload.signal?.type);
  console.log("🎯 Compression:", payload.compression?.totalRange);

  const derived = computeJewelSignals({
    fast: payload.jewel?.fast,
    slow: payload.jewel?.slow,
    high: payload.jewel?.high,
    fib: payload.jewel?.fib,
    bbwp: payload.bbwp?.value,
    slopeFast: payload.slope?.fast,
    slopeSlow: payload.slope?.slow,
    signalType: payload.signal?.type,
    signalStrength: payload.signal?.strength,
  });

  const record = {
    event_source: payload.event_source || "tradingview",
    symbol: payload.symbol || null,
    ticker: payload.ticker || payload.symbol || null,
    direction:
      derived.signalType ||
      payload.direction ||
      payload.signal?.type ||
      null,
    price: toNumber(payload.price),
    timestamp: parsedTimestamp.toISOString(),
    timeframe: payload.timeframe,
    timeframe_minutes: timeframeMinutes,
    // OHLC
    ohlc_open: toNumber(payload.ohlc?.open),
    ohlc_high: toNumber(payload.ohlc?.high),
    ohlc_low: toNumber(payload.ohlc?.low),
    ohlc_close: toNumber(payload.ohlc?.close),
    ohlc_volume: toNumber(payload.ohlc?.volume),
    // Jewel
    jewel_fast: toNumber(payload.jewel?.fast),
    jewel_slow: toNumber(payload.jewel?.slow),
    jewel_high: toNumber(payload.jewel?.high),
    jewel_fib: toNumber(payload.jewel?.fib),
    // BBWP
    bbwp_value:
      typeof derived.bbwpValue === "number"
        ? derived.bbwpValue
        : toNumber(payload.bbwp?.value),
    bbwp_classification:
      derived.bbwpClassification || payload.bbwp?.classification || null,
    // Gaussian
    gaussian_filter: toNumber(payload.gaussian?.filter),
    gaussian_price_position: toNumber(payload.gaussian?.pricePosition),
    gaussian_above_filter:
      typeof payload.gaussian?.aboveFilter === "boolean"
        ? payload.gaussian.aboveFilter
        : null,
    // Compression
    compression_total_range:
      derived.compressionTotalRange ??
      toNumber(payload.compression?.totalRange),
    compression_center:
      derived.compressionCenter ?? toNumber(payload.compression?.center),
    compression_fib_zone:
      derived.compressionFibZone || payload.compression?.fibZone || null,
    compression_nearest_fib_level:
      derived.nearestFibLevel ??
      toNumber(payload.compression?.nearestFibLevel),
    compression_fib_cutting:
      derived.fibCutting ??
      booleanOrNull(payload.compression?.fibCutting),
    compression_extreme_compression:
      derived.extremeCompression ??
      booleanOrNull(payload.compression?.extremeCompression),
    compression_perfect_setup:
      derived.perfectSetup ??
      booleanOrNull(payload.compression?.perfectSetup),
    // Slope
    slope_fast: toNumber(payload.slope?.fast),
    slope_slow: toNumber(payload.slope?.slow),
    // Signal
    signal_type:
      derived.signalType || payload.signal?.type || payload.direction || null,
    signal_strength:
      derived.signalStrength ?? toNumber(payload.signal?.strength),
    signal_buy_score:
      typeof derived.buyScore === "number"
        ? derived.buyScore
        : toNumber(payload.signal?.buyScore),
    signal_sell_score:
      typeof derived.sellScore === "number"
        ? derived.sellScore
        : toNumber(payload.signal?.sellScore),
    raw_payload: payload,
    received_at: new Date().toISOString(),
  };

  try {
    const { data: inserted, error } = await supabase
      .from(SUPABASE_SIGNALS_TABLE)
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert failed:", error);
      return res.status(500).json({ error: "Database insert failed" });
    }

    if (record.compression_perfect_setup) {
      console.log("💎 PERFECT SETUP DETECTED!");
    }

    console.log("✅ Signal saved:", inserted?.id);
    console.log("===== END WEBHOOK =====\n");

    return res.status(200).json({
      success: true,
      id: inserted?.id,
      symbol: record.symbol,
      timeframe: record.timeframe,
      type: record.signal_type,
    });
  } catch (err) {
    console.error("Unexpected error handling webhook:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

app.get("/api/confluence/:symbol", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { symbol } = req.params;
  const timeframes = ["15m", "2h", "4h"];
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const result = {
    symbol,
    timeframes: {},
    confluenceScore: 0,
    activeTimeframes: 0,
  };

  try {
    for (const tf of timeframes) {
      const { data, error } = await supabase
        .from(SUPABASE_SIGNALS_TABLE)
        .select("*")
        .eq("symbol", symbol)
        .eq("timeframe", tf)
        .gte("timestamp", since)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        continue;
      }

      const compressed = typeof data.compression_total_range === "number"
        ? data.compression_total_range < 4
        : false;
      const extremeZone = typeof data.compression_center === "number"
        ? data.compression_center < 20 || data.compression_center > 80
        : false;
      const slopeDirection =
        typeof data.slope_fast === "number"
          ? data.slope_fast > 0
            ? "bullish"
            : data.slope_fast < 0
            ? "bearish"
            : "neutral"
          : "neutral";

      const ageMinutes = Math.round(
        (Date.now() - new Date(data.timestamp).getTime()) / 60000
      );

      result.timeframes[tf] = {
        signal: data,
        compressed,
        extremeZone,
        slopeDirection,
        age: `${ageMinutes} min ago`,
      };

      let score = 0;
      if (compressed) score += 25;
      if (extremeZone) score += 20;
      if (typeof data.slope_fast === "number" && data.slope_fast > 1) {
        score += 15;
      }
      if (data.signal_type?.includes("BUY")) {
        score += 15;
      }
      if (typeof data.bbwp_value === "number" && data.bbwp_value < 30) {
        score += 10;
      }

      result.confluenceScore += score;
      result.activeTimeframes += 1;
    }

    if (result.activeTimeframes > 0) {
      result.confluenceScore = Math.round(
        result.confluenceScore / result.activeTimeframes
      );
    }

    if (result.confluenceScore >= 70 && result.activeTimeframes >= 2) {
      result.recommendation = "STRONG BUY CONFLUENCE";
    } else if (result.confluenceScore >= 50) {
      result.recommendation = "MODERATE CONFLUENCE";
    } else {
      result.recommendation = "WEAK CONFLUENCE";
    }

    res.json(result);
  } catch (error) {
    console.error("Confluence endpoint error:", error);
    res.status(500).json({ error: "Failed to compute confluence" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled exception:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function booleanOrNull(value) {
  if (typeof value === "boolean") {
    return value;
  }
  return null;
}
