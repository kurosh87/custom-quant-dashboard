import type { CSSProperties } from "react"
import path from "path"
import { promises as fs } from "fs"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { JewelOscillatorChart } from "@/components/jewel-oscillator-chart"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { HistoryRow } from "@/components/history-data-table"
import { HistoryTimeframeTabs } from "@/components/history-timeframe-tabs"

export default async function Page() {
  await auth.protect()
  const user = await currentUser()
  const [
    jewel15m,
    jewel2h,
    jewel4h,
    latest15m,
    latest2h,
    latest4h,
    fearGreed,
    bitcoinPrice,
    dashboardDatasets,
  ] = await Promise.all([
    fetchJewelSeries("15m"),
    fetchJewelSeries("2h"),
    fetchJewelSeries("4h"),
    fetchLatestSignal("15m"),
    fetchLatestSignal("2h"),
    fetchLatestSignal("4h"),
    fetchFearGreedLatest(),
    fetchBitcoinPrice(),
    fetchDashboardDatasets(),
  ])

  const sidebarUser = {
    name:
      user?.fullName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      "Account",
    email:
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "—",
    avatar: user?.imageUrl ?? "",
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" user={sidebarUser} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col px-4 py-4 md:px-8 md:py-6">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 md:gap-6">
              <SectionCards
                summary={latest15m}
                fearGreed={fearGreed}
                price={bitcoinPrice}
              />
              <div className="grid gap-4 lg:grid-cols-[3fr,1fr]">
                <Tabs defaultValue="15m" className="flex flex-col gap-4">
                  <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @md:flex">
                    <TabsTrigger value="15m">15 Minute</TabsTrigger>
                    <TabsTrigger value="2h">2 Hour</TabsTrigger>
                    <TabsTrigger value="4h">4 Hour</TabsTrigger>
                  </TabsList>
                  <TabsContent value="15m" className="space-y-4">
                    <JewelOscillatorChart
                      data={jewel15m}
                      title="15 Minute Fast Line"
                      description="Jewel fast oscillator (0 – 100)"
                    />
                  </TabsContent>
                  <TabsContent value="2h" className="space-y-4">
                    <JewelOscillatorChart
                      data={jewel2h}
                      title="2 Hour Fast Line"
                      description="Jewel fast oscillator (0 – 100)"
                    />
                  </TabsContent>
                  <TabsContent value="4h" className="space-y-4">
                    <JewelOscillatorChart
                      data={jewel4h}
                      title="4 Hour Fast Line"
                      description="Jewel fast oscillator (0 – 100)"
                      curveType="basis"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            <ConfluenceCards />
              <HistoryTimeframeTabs datasets={dashboardDatasets} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

const CSV_FILE_MAP: Record<string, string> = {
  "15m": "BINANCE_BTCUSDT, 15.csv",
  "2h": "BINANCE_BTCUSDT, 120.csv",
  "4h": "BINANCE_BTCUSDT, 240.csv",
}
const DASHBOARD_SYMBOL =
  process.env.DEFAULT_HISTORY_SYMBOL ?? "BTCUSDT"
const DASHBOARD_TABLE_TIMEFRAMES = (
  process.env.DASHBOARD_TABLE_TIMEFRAMES?.split(",") ?? [
    "15m",
    "2h",
    "4h",
  ]
).map((tf) => tf.trim())
const TIMEFRAME_LABELS: Record<string, string> = {
  "15m": "15 Minute",
  "2h": "2 Hour",
  "4h": "4 Hour",
}
const STATIC_DATASET_FALLBACK: DashboardDatasets = {
  "2h": [
    createStaticRow("2h", {
      id: "static-2h-1",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      price: 91680,
      signalType: "Strong Buy",
      signalStrength: 4,
      buyScore: 78,
      compressionRange: 3.2,
      compressionCenter: 24.1,
      compressionZone: "⬇️ Low",
      compressionPerfectSetup: true,
      bbwpValue: 26,
      bbwpClassification: "Low",
      jewelFast: 38.4,
      jewelSlow: 30.7,
      jewelHigh: 26.2,
    }),
    createStaticRow("2h", {
      id: "static-2h-2",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      price: 91210,
      signalType: "Neutral",
      signalStrength: 2,
      buyScore: 45,
      sellScore: 40,
      compressionRange: 4.8,
      compressionCenter: 42.4,
      compressionZone: "○ Mid",
      bbwpValue: 34,
      bbwpClassification: "Transition",
      jewelFast: 38.5,
      jewelSlow: 35.4,
      jewelHigh: 30.3,
    }),
    createStaticRow("2h", {
      id: "static-2h-3",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      price: 90740,
      signalType: "Strong Sell",
      signalStrength: 4,
      buyScore: 22,
      sellScore: 68,
      compressionRange: 11.2,
      compressionCenter: 71.1,
      compressionZone: "⬆️ High",
      bbwpValue: 58,
      bbwpClassification: "Transition",
      jewelFast: 70.2,
      jewelSlow: 62.8,
      jewelHigh: 58.4,
    }),
  ],
  "4h": [
    createStaticRow("4h", {
      id: "static-4h-1",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      price: 90550,
      signalType: "Strong Buy",
      signalStrength: 4,
      buyScore: 82,
      compressionRange: 4.1,
      compressionCenter: 30.2,
      compressionZone: "⬇️ Low",
      compressionPerfectSetup: true,
      bbwpValue: 48,
      bbwpClassification: "Transition",
      jewelFast: 28.2,
      jewelSlow: 23.7,
      jewelHigh: 20.1,
    }),
    createStaticRow("4h", {
      id: "static-4h-2",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      price: 89880,
      signalType: "Strong Sell",
      signalStrength: 4,
      buyScore: 40,
      sellScore: 75,
      compressionRange: 5.2,
      compressionCenter: 61.5,
      compressionZone: "⬆️ High",
      bbwpValue: 72,
      bbwpClassification: "Expansion",
      jewelFast: 66.3,
      jewelSlow: 58.8,
      jewelHigh: 54.1,
    }),
    createStaticRow("4h", {
      id: "static-4h-3",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      price: 89220,
      signalType: "Buy",
      signalStrength: 3,
      buyScore: 60,
      sellScore: 28,
      compressionRange: 3.6,
      compressionCenter: 26.2,
      compressionZone: "⬇️ Low",
      bbwpValue: 22,
      bbwpClassification: "Low",
      jewelFast: 32.6,
      jewelSlow: 26.1,
      jewelHigh: 22.4,
    }),
  ],
}

type JewelEntry = {
  timestamp: string
  fast: number
  slow: number
  high: number
  fib: number | null
}

async function fetchJewelSeries(timeframe: string, limit = 200) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from("signals")
    .select(
      "timestamp, received_at, jewel_fast, jewel_slow, jewel_high, jewel_fib"
    )
    .eq("timeframe", timeframe)
    .not("jewel_fast", "is", null)
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error("Failed to load jewel series", error)
    return []
  }

  const normalized = new Map<string, JewelEntry>()

  const supEntries =
    data
      ?.map((entry) => {
        const stamp = entry.timestamp || entry.received_at
        if (!stamp) return null
        if (
          typeof entry.jewel_fast !== "number" ||
          typeof entry.jewel_slow !== "number" ||
          typeof entry.jewel_high !== "number"
        ) {
          return null
        }

        return {
          timestamp: new Date(stamp).toISOString(),
          fast: entry.jewel_fast as number,
          slow: entry.jewel_slow as number,
          high: entry.jewel_high as number,
          fib:
            typeof entry.jewel_fib === "number" ? entry.jewel_fib : null,
        }
      })
      .filter(
        (entry): entry is JewelEntry =>
          Boolean(entry?.timestamp) &&
          typeof entry?.fast === "number" &&
          typeof entry?.slow === "number" &&
          typeof entry?.high === "number"
      ) ?? []

  for (const entry of supEntries) {
    normalized.set(entry.timestamp, entry)
  }

  if (normalized.size < limit) {
    const csvEntries = await loadCsvSeries(timeframe, limit * 2)
    for (const entry of csvEntries) {
      if (!normalized.has(entry.timestamp)) {
        normalized.set(entry.timestamp, entry)
      }
    }
  }

  return Array.from(normalized.values())
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .slice(-limit)
    .map((entry) => ({
      timestamp: new Date(entry.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      fast: entry.fast,
      slow: entry.slow,
      high: entry.high,
      fib: entry.fib,
    }))
}

async function fetchLatestSignal(timeframe: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from("signals")
    .select(
      "compression_total_range, compression_center, compression_fib_zone, signal_type, signal_strength, signal_buy_score, bbwp_value, bbwp_classification, jewel_fast, jewel_slow, jewel_high, timestamp"
    )
    .eq("timeframe", timeframe)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error("Failed to load latest signal", error)
    return null
  }

  return {
    compressionRange: typeof data.compression_total_range === "number" ? data.compression_total_range : null,
    compressionCenter: typeof data.compression_center === "number" ? data.compression_center : null,
    compressionZone: data.compression_fib_zone ?? null,
    signalType: data.signal_type ?? null,
    signalStrength: typeof data.signal_strength === "number" ? data.signal_strength : null,
    buyScore: typeof data.signal_buy_score === "number" ? data.signal_buy_score : null,
    bbwpValue: typeof data.bbwp_value === "number" ? data.bbwp_value : null,
    bbwpClassification: data.bbwp_classification ?? null,
    fast: typeof data.jewel_fast === "number" ? data.jewel_fast : null,
    slow: typeof data.jewel_slow === "number" ? data.jewel_slow : null,
    high: typeof data.jewel_high === "number" ? data.jewel_high : null,
  }
}

type DashboardDatasets = Record<string, HistoryRow[]>

function createStaticRow(
  timeframe: string,
  overrides: Partial<HistoryRow> = {}
): HistoryRow {
  const timestamp = overrides.timestamp ?? new Date().toISOString()
  return {
    id:
      overrides.id ??
      `static-${timeframe}-${Math.random().toString(36).slice(2)}`,
    symbol: overrides.symbol ?? DASHBOARD_SYMBOL,
    timeframe,
    timestamp,
    recordedAt: overrides.recordedAt ?? null,
    price: overrides.price ?? 91500,
    btcDeltaPercent: overrides.btcDeltaPercent ?? null,
    signalType: overrides.signalType ?? "BUY",
    signalStrength: overrides.signalStrength ?? 3,
    buyScore: overrides.buyScore ?? 60,
    sellScore: overrides.sellScore ?? 10,
    compressionRange: overrides.compressionRange ?? 3.2,
    compressionCenter: overrides.compressionCenter ?? 24,
    compressionZone: overrides.compressionZone ?? "⬇️ Low",
    compressionPerfectSetup: overrides.compressionPerfectSetup ?? false,
    bbwpValue: overrides.bbwpValue ?? 22,
    bbwpClassification: overrides.bbwpClassification ?? "Low",
    jewelFast: overrides.jewelFast ?? 34,
    jewelSlow: overrides.jewelSlow ?? 29,
    jewelHigh: overrides.jewelHigh ?? 23,
    payload: overrides.payload ?? { source: "static sample" },
  }
}

async function fetchDashboardDatasets(
  limit = 100
): Promise<DashboardDatasets> {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return DASHBOARD_TABLE_TIMEFRAMES.reduce<DashboardDatasets>(
      (acc, timeframe) => {
        acc[timeframe] = []
        return acc
      },
      {}
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const result: DashboardDatasets = {}

  for (const timeframe of DASHBOARD_TABLE_TIMEFRAMES) {
  const { data, error } = await supabase
    .from("signals")
    .select(
      "id, symbol, ticker, price, timeframe, timestamp, received_at, signal_type, signal_strength, signal_buy_score, signal_sell_score, compression_total_range, compression_center, compression_fib_zone, compression_perfect_setup, bbwp_value, bbwp_classification, jewel_fast, jewel_slow, jewel_high, raw_payload"
    )
      .eq("symbol", DASHBOARD_SYMBOL)
      .eq("timeframe", timeframe)
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (error || !data) {
      console.error("Failed to load dashboard rows", timeframe, error)
      result[timeframe] = []
      continue
    }

    let rows: HistoryRow[] =
      data.map((entry) => {
        const derivedRange = deriveRangeFromJewel(
          entry.jewel_fast,
          entry.jewel_slow,
          entry.jewel_high
        )
        const signalLabel = entry.signal_type?.toUpperCase() ?? ""
        return {
          id: toStringValue(entry.id),
          symbol: entry.symbol ?? entry.ticker ?? null,
          timeframe: entry.timeframe ?? timeframe,
          timestamp: entry.timestamp ?? null,
          recordedAt: entry.received_at ?? null,
          price: typeof entry.price === "number" ? entry.price : null,
          btcDeltaPercent: null,
          signalType: entry.signal_type ?? null,
          signalStrength:
            typeof entry.signal_strength === "number"
              ? entry.signal_strength
              : null,
          buyScore:
            typeof entry.signal_buy_score === "number"
              ? entry.signal_buy_score
              : null,
          sellScore:
            typeof entry.signal_sell_score === "number"
              ? entry.signal_sell_score
              : null,
          compressionRange:
            typeof entry.compression_total_range === "number"
              ? entry.compression_total_range
              : derivedRange,
          compressionCenter:
            typeof entry.compression_center === "number"
              ? entry.compression_center
              : null,
          compressionZone: entry.compression_fib_zone ?? null,
          compressionPerfectSetup:
            typeof entry.compression_perfect_setup === "boolean"
              ? entry.compression_perfect_setup
              : Boolean(
                  derivedRange !== null &&
                    derivedRange <= 3 &&
                    signalLabel.includes("BUY")
                ),
          bbwpValue:
            typeof entry.bbwp_value === "number" ? entry.bbwp_value : null,
          bbwpClassification: entry.bbwp_classification ?? null,
          jewelFast:
            typeof entry.jewel_fast === "number" ? entry.jewel_fast : null,
          jewelSlow:
            typeof entry.jewel_slow === "number" ? entry.jewel_slow : null,
          jewelHigh:
            typeof entry.jewel_high === "number" ? entry.jewel_high : null,
          payload:
            (entry.raw_payload as Record<string, unknown> | null) ?? {
              note: "Awaiting realtime payload",
            },
        }
      }) ?? []

    if (rows.length === 0) {
      rows = await loadCsvHistoryRows(timeframe, limit)
    }

    if (rows.length === 0 && STATIC_DATASET_FALLBACK[timeframe]) {
      rows = STATIC_DATASET_FALLBACK[timeframe].map((row) => ({
        ...row,
        id: `${row.id}-${Date.now()}`,
      }))
    }

    result[timeframe] = applyPriceDelta(rows)
  }

  return result
}

async function fetchFearGreedLatest() {
  try {
    const response = await fetch(
      "https://api.alternative.me/fng/?format=json&limit=1",
      {
        next: { revalidate: 300 },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch fear & greed index: ${response.status}`)
    }

    const payload = (await response.json()) as {
      data?: { value: string; value_classification: string }[]
    }

    const latest = payload.data?.[0]

    if (!latest) {
      return { value: null, classification: null }
    }

    return {
      value: Number(latest.value),
      classification: latest.value_classification,
    }
  } catch (error) {
    console.error("Fear & Greed API error", error)
    return { value: null, classification: null }
  }
}

async function fetchBitcoinPrice() {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
      {
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch BTC price: ${response.status}`)
    }

    const payload = (await response.json()) as {
      lastPrice?: string
      priceChangePercent?: string
      openPrice?: string
      highPrice?: string
      lowPrice?: string
    }
    const value = payload.lastPrice ? Number(payload.lastPrice) : null
    const changePercent = payload.priceChangePercent
      ? Number(payload.priceChangePercent)
      : null
    const open = payload.openPrice ? Number(payload.openPrice) : null
    const high = payload.highPrice ? Number(payload.highPrice) : null
    const low = payload.lowPrice ? Number(payload.lowPrice) : null

    if (typeof value !== "number" || Number.isNaN(value)) {
      return { value: null }
    }

    return { value, changePercent, open, high, low }
  } catch (error) {
    console.error("BTC price fetch error", error)
    return { value: null }
  }
}

async function loadCsvSeries(timeframe: string, limit: number) {
  const fileName = CSV_FILE_MAP[timeframe]
  if (!fileName) {
    return []
  }

  try {
    const filePath = path.join(process.cwd(), fileName)
    const raw = await fs.readFile(filePath, "utf8")
    const lines = raw.trim().split(/\r?\n/)
    if (lines.length <= 1) {
      return []
    }

    const headerCounts: Record<string, number> = {}
    const headers = lines[0]
      .split(",")
      .map((header) => {
        const key = header.trim().replace(/\s+/g, "_").toLowerCase()
        headerCounts[key] = (headerCounts[key] || 0) + 1
        return headerCounts[key] > 1 ? `${key}_${headerCounts[key]}` : key
      })

    const points: JewelEntry[] = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue
      const cells = lines[i].split(",")
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = cells[idx]?.trim() ?? ""
      })

      const timestampSeconds = toNumber(row["time"])
      const fast = firstAvailable(row["fast_2"], row["fast"])
      const slow = firstAvailable(row["slow_2"], row["slow"])
      const high = firstAvailable(row["high_3"], row["high_2"], row["high"])
      const fib = firstAvailable(row["fib_2"], row["fib"])

      if (
        timestampSeconds === null ||
        fast === null ||
        slow === null ||
        high === null
      ) {
        continue
      }

      points.push({
        timestamp: new Date(timestampSeconds * 1000).toISOString(),
        fast,
        slow,
        high,
        fib,
      })
    }

    return points.slice(-limit)
  } catch (error) {
    console.error("CSV load error", timeframe, error)
    return []
  }
}

function toNumber(value?: string) {
  if (typeof value !== "string") {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function firstAvailable(...values: (string | undefined)[]) {
  for (const value of values) {
    const num = toNumber(value)
    if (num !== null) {
      return num
    }
  }
  return null
}

function toStringValue(value: unknown) {
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toString()
  return value ? String(value) : Math.random().toString(36).slice(2)
}

async function loadCsvHistoryRows(
  timeframe: string,
  limit: number
): Promise<HistoryRow[]> {
  const fileName = CSV_FILE_MAP[timeframe]
  if (!fileName) {
    return []
  }

  try {
    const filePath = path.join(process.cwd(), fileName)
    const raw = await fs.readFile(filePath, "utf8")
    const lines = raw.trim().split(/\r?\n/)
    if (lines.length <= 1) {
      return []
    }

    const headerCounts: Record<string, number> = {}
    const headers = lines[0]
      .split(",")
      .map((header) => {
        const key = header.trim().replace(/\s+/g, "_").toLowerCase()
        headerCounts[key] = (headerCounts[key] || 0) + 1
        return headerCounts[key] > 1 ? `${key}_${headerCounts[key]}` : key
      })

    const rows: HistoryRow[] = []
    for (let i = lines.length - 1; i >= 1; i--) {
      if (rows.length >= limit) break
      const line = lines[i]
      if (!line) continue
      const cells = line.split(",")
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = cells[idx]?.trim() ?? ""
      })

      const timestampSeconds = toNumber(row["time"])
      if (!timestampSeconds) continue
      const price = toNumber(row["close"])
      const fast = firstAvailable(row["fast_2"], row["fast"])
      const slow = firstAvailable(row["slow_2"], row["slow"])
      const high = firstAvailable(row["high_3"], row["high_2"], row["high"])

      rows.push({
        id: `csv-${timeframe}-${timestampSeconds}-${rows.length}`,
        symbol: DASHBOARD_SYMBOL,
        timeframe,
        timestamp: new Date(timestampSeconds * 1000).toISOString(),
        recordedAt: null,
        price,
        btcDeltaPercent: null,
        signalType: row["signal_type"] ?? null,
        signalStrength: null,
        buyScore: toNumber(row["buy_score"]),
        sellScore: toNumber(row["sell_score"]),
        compressionRange:
          fast !== null && slow !== null ? Math.abs(fast - slow) : null,
        compressionCenter:
          fast !== null && slow !== null && high !== null
            ? (fast + slow + high) / 3
            : null,
        compressionZone: row["fib_zone"] ?? null,
        compressionPerfectSetup: row["perfect_setup"] === "1",
        bbwpValue: toNumber(row["bbwp"]),
        bbwpClassification: row["bbwp_classification"] ?? null,
        jewelFast: fast,
        jewelSlow: slow,
        jewelHigh: high,
        payload: { source: "CSV backfill" },
      })
    }

    return rows
  } catch (error) {
    console.error("CSV history load error", timeframe, error)
    return []
  }
}

function applyPriceDelta(rows: HistoryRow[]) {
  if (!rows.length) {
    return rows
  }

  return rows.map((row, index) => {
    const previous = rows[index + 1]
    if (
      row.price === null ||
      row.price === undefined ||
      !previous ||
      previous.price === null ||
      previous.price === undefined
    ) {
      return { ...row, btcDeltaPercent: null }
    }

    const delta = ((row.price - previous.price) / previous.price) * 100
    return { ...row, btcDeltaPercent: Number(delta.toFixed(2)) }
  })
}

function deriveRangeFromJewel(
  fast: unknown,
  slow: unknown,
  high: unknown
) {
  const values = [fast, slow, high]
    .map((val) =>
      typeof val === "number" && Number.isFinite(val) ? val : null
    )
    .filter((val): val is number => val !== null)

  if (values.length < 2) {
    return null
  }

  return (
    Math.max(...values) -
    Math.min(...values)
  )
}

function ConfluenceCards() {
  const frames = [
    {
      label: "15m",
      badge: "Micro Bias",
      compression: "🟢 Compressed (3.1)",
      zone: "📍 Extreme Low (19.2)",
      signal: "⭐⭐⭐⭐⭐ GOD_BUY",
      jewel: { fast: 32.4, slow: 27.8, high: 23.4 },
      constriction: { state: "tight", label: "TIGHT", metric: "3.1 range" },
      bbwp: { value: 4, window: "4 / 100", ma: 8, lookback: 100 },
    },
    {
      label: "1h",
      badge: "Session Bias",
      compression: "🟢 Compressed (3.2)",
      zone: "📍 Extreme Low (22.5)",
      signal: "⭐⭐⭐⭐⭐ GOD_BUY",
      jewel: { fast: 41.8, slow: 33.6, high: 29.1 },
      constriction: { state: "tight", label: "TIGHT", metric: "3.2 range" },
      bbwp: { value: 18, window: "18 / 100", ma: 25, lookback: 100 },
    },
    {
      label: "4h",
      badge: "Swing Bias",
      compression: "🟢 Compressed (3.8)",
      zone: "📍 Low (28.4)",
      signal: "⭐⭐⭐⭐ ULTRA_BUY",
      jewel: { fast: 55.3, slow: 42.7, high: 36.8 },
      constriction: { state: "neutral", label: "NEUTRAL", metric: "3.8 range" },
      bbwp: { value: 78, window: "78 / 100", ma: 65, lookback: 100 },
    },
  ]

  const constrictionStyles: Record<
    string,
    { border: string; bg: string; text: string }
  > = {
    tight: {
      border: "border-orange-300/70 dark:border-orange-900/50",
      bg: "bg-orange-50/80 dark:bg-orange-900/10",
      text: "text-orange-700",
    },
    neutral: {
      border: "border-muted/60 dark:border-muted/40",
      bg: "bg-muted/30 dark:bg-muted/10",
      text: "text-muted-foreground",
    },
  }

  const bbwpState = (value: number, ma?: number) => {
    if (value >= 95) {
      return {
        label: "Volatility Max",
        text: "text-red-600 dark:text-red-300",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200",
        description: "BBW is in the top 5% of the lookback window. Trend may be nearing exhaustion; watch for macro turns.",
      }
    }
    if (value >= 70) {
      return {
        label: "Expansion",
        text: "text-red-600 dark:text-red-300",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200",
        description: "BBW percentile is rising; volatility is expanding and range moves can accelerate.",
      }
    }
    if (value >= 30) {
      return {
        label: "Transition",
        text: "text-amber-600 dark:text-amber-300",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200",
        description: "Percentile is mid-cycle. Track BBWP vs its moving average for early breakout cues.",
      }
    }
    if (value <= 5) {
      return {
        label: "Volatility Floor",
        text: "text-sky-600 dark:text-sky-300",
        badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-200",
        description: "BBW is in the lowest 5% of history. Expect violent expansion once percentile recaptures its MA.",
      }
    }
    return {
      label: "Contracting",
      text: "text-sky-600 dark:text-sky-300",
      badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-200",
      description: "BBW percentile still depressed. Monitoring for percentile > MA to confirm breakout.",
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-4">
        {frames.map((frame) => {
          const state = bbwpState(frame.bbwp.value, frame.bbwp.ma)
          const style = constrictionStyles[frame.constriction.state] ?? {
            border: "border-muted/60 dark:border-muted/40",
            bg: "bg-muted/30 dark:bg-muted/10",
            text: "text-muted-foreground",
          }
          return (
            <div
              key={frame.label}
              className="rounded-2xl border border-emerald-200/60 bg-emerald-50/20 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-semibold">{frame.label}</p>
                  <p className="text-xs text-muted-foreground">{frame.badge}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div
                  className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${style.border} ${style.bg} flex items-center justify-between`}
                >
                  <div>
                    <p className="text-muted-foreground uppercase tracking-wide">
                      Constriction
                    </p>
                    <p className={style.text}>{frame.compression}</p>
                  </div>
                  <span className="text-muted-foreground">
                    {frame.constriction.metric}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-muted/60 bg-white/70 px-3 py-2 text-xs dark:bg-muted/10">
                  <span className="text-muted-foreground uppercase tracking-wide">
                    Fib zone
                  </span>
                  <span className="font-semibold">{frame.zone}</span>
                </div>
                <div className="rounded-2xl border border-muted/60 bg-white/70 px-3 py-2 text-xs dark:bg-muted/10">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Jewel lines
                  </p>
                  <div className="mt-2 grid gap-2 text-xs font-semibold">
                    <div className="flex items-center justify-between text-sky-500">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-sky-400" />
                        Fast
                      </span>
                      <span>{frame.jewel.fast.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-pink-500">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-pink-400" />
                        Slow
                      </span>
                      <span>{frame.jewel.slow.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-amber-500">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-amber-400" />
                        High
                      </span>
                      <span>{frame.jewel.high.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-muted/60 bg-white/80 px-3 py-2 text-xs dark:bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">
                        BBWP
                      </p>
                      <p className={`text-base font-semibold ${state.text}`}>
                        {frame.bbwp.value}%{" "}
                        {frame.bbwp.ma !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            vs MA {frame.bbwp.ma}%
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary" className={state.badge}>
                      {state.label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {state.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="rounded-2xl border border-yellow-200/70 bg-gradient-to-br from-amber-50 via-yellow-50 to-rose-50 p-4 text-sm dark:border-yellow-900/40 dark:from-yellow-950/10 dark:via-amber-900/10 dark:to-rose-950/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold">Signal quality</p>
            <p className="text-xs text-muted-foreground">
              15m / 1h / 4h composite
            </p>
          </div>
          <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            Oversold stack
          </Badge>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-yellow-200 bg-white px-4 py-3 font-semibold text-yellow-600 shadow-sm dark:border-yellow-800 dark:bg-yellow-950">
            <span>Confluence</span>
            <span>⚡ 3 / 3</span>
          </div>
          <div className="rounded-2xl border border-yellow-200/80 bg-white/80 px-4 py-3 text-xs text-muted-foreground dark:bg-yellow-950/20">
            All frames oversold with compression under 4 pts. Play continuation
            until BBWP pierces 70%+ and jewel fast &gt; 45.
          </div>
          <div className="rounded-2xl border border-dashed border-yellow-300 bg-yellow-50/80 px-4 py-3 text-xs dark:border-yellow-600 dark:bg-yellow-900/20">
            <p className="font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
              Risk window
            </p>
            <p>
              Fade setup when BBWP &gt; 80% or fib center climbs above 35. Watch
              for signal downgrades on 1h.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
