import type { CSSProperties } from "react"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

import { AppSidebar } from "@/components/app-sidebar"
import { HistoryTimeframeTabs } from "@/components/history-timeframe-tabs"
import type { HistoryRow } from "@/components/history-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function HistoryPage() {
  await auth.protect()
  const user = await currentUser()
  const historyDatasets = await fetchSignalHistory()

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <HistoryTimeframeTabs datasets={historyDatasets} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

const TIMEFRAMES = ["15m", "2h", "4h"] as const
const DEFAULT_SYMBOL = process.env.DEFAULT_HISTORY_SYMBOL ?? "BTCUSDT"

type TradingViewPayload = {
  timestamp?: number | string
  symbol?: string
  timeframe?: string
  price?: number | string
  ohlc?: { close?: number | string }
  signal?: {
    type?: string
    strength?: number | string
    buyScore?: number | string
    sellScore?: number | string
  }
  bbwp?: { value?: number | string; classification?: string }
  jewel?: {
    fast?: number | string
    slow?: number | string
    high?: number | string
    fib?: number | string
  }
  compression?: {
    totalRange?: number | string
    center?: number | string
    fibZone?: string
    perfectSetup?: boolean
  }
}

async function fetchSignalHistory(): Promise<Record<string, HistoryRow[]>> {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase credentials missing – history data unavailable.")
    return {
      "15m": [],
      "2h": [],
      "4h": [],
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const datasets: Record<string, HistoryRow[]> = {
    "15m": [],
    "2h": [],
    "4h": [],
  }

  await Promise.all(
    TIMEFRAMES.map(async (timeframe) => {
      const { data, error } = await supabase
        .from("signals")
        .select(
          "id, symbol, ticker, price, timeframe, timestamp, received_at, signal_type, signal_strength, signal_buy_score, signal_sell_score, compression_total_range, compression_center, compression_fib_zone, compression_perfect_setup, bbwp_value, bbwp_classification, jewel_fast, jewel_slow, jewel_high, raw_payload"
        )
        .eq("symbol", DEFAULT_SYMBOL)
        .eq("timeframe", timeframe)
        .order("timestamp", { ascending: false })
        .limit(200)

      if (error || !data) {
        console.error("Failed to load history for timeframe", timeframe, error)
        datasets[timeframe] = []
        return
      }

      datasets[timeframe] = data.map((entry) => {
        const payload = normalizePayload(
          entry.raw_payload
        ) as TradingViewPayload | null

        const timestamp = entry.timestamp ?? toIsoString(payload?.timestamp)
        const recordedAt = entry.received_at ?? new Date().toISOString()
        const id = toString(entry.id) ?? makeFallbackId()

        const row: HistoryRow = {
          id,
          symbol: entry.symbol ?? entry.ticker ?? toString(payload?.symbol),
          timeframe: entry.timeframe ?? toString(payload?.timeframe),
          timestamp,
          recordedAt,
          price: coerceNumber(
            entry.price ?? payload?.price ?? payload?.ohlc?.close
          ),
          btcDeltaPercent: null,
          signalType: entry.signal_type ?? toString(payload?.signal?.type),
          signalStrength: coerceNumber(
            entry.signal_strength ?? payload?.signal?.strength
          ),
          buyScore: coerceNumber(
            entry.signal_buy_score ?? payload?.signal?.buyScore
          ),
          sellScore: coerceNumber(
            entry.signal_sell_score ?? payload?.signal?.sellScore
          ),
          compressionRange: coerceNumber(
            entry.compression_total_range ?? payload?.compression?.totalRange
          ),
          compressionCenter: coerceNumber(
            entry.compression_center ?? payload?.compression?.center
          ),
          compressionZone:
            entry.compression_fib_zone ?? payload?.compression?.fibZone ?? null,
          compressionPerfectSetup:
            typeof entry.compression_perfect_setup === "boolean"
              ? entry.compression_perfect_setup
              : payload?.compression?.perfectSetup ?? null,
          bbwpValue: coerceNumber(entry.bbwp_value ?? payload?.bbwp?.value),
          bbwpClassification:
            entry.bbwp_classification ?? payload?.bbwp?.classification ?? null,
          jewelFast: coerceNumber(entry.jewel_fast ?? payload?.jewel?.fast),
          jewelSlow: coerceNumber(entry.jewel_slow ?? payload?.jewel?.slow),
          jewelHigh: coerceNumber(entry.jewel_high ?? payload?.jewel?.high),
          payload: (payload ?? null) as Record<string, unknown> | null,
        }

        return row
      })
    })
  )

  return datasets
}

function normalizePayload(
  raw: unknown
): Record<string, unknown> | null {
  if (!raw) {
    return null
  }

  if (typeof raw === "object") {
    const candidate = raw as Record<string, unknown>

    if (
      "raw" in candidate &&
      typeof candidate.raw === "string"
    ) {
      try {
        return JSON.parse(candidate.raw)
      } catch (err) {
        console.error("Failed to parse webhook payload", err)
        return { raw: candidate.raw }
      }
    }

    return candidate
  }

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch (err) {
      console.error("Failed to parse webhook payload string", err)
      return { raw }
    }
  }

  return null
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
}

function toIsoString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString()
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString()
    }
  }

  return null
}

function toString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString()
  }

  return null
}

function makeFallbackId() {
  return Math.random().toString(36).slice(2)
}
