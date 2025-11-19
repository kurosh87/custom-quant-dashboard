import type { CSSProperties } from "react"

import { auth, currentUser } from "@clerk/nextjs/server"

import { AppSidebar } from "@/components/app-sidebar"
import { FearGreedGauge } from "@/components/fear-greed-gauge"
import {
  FearGreedHistoryChart,
  type FearGreedHistoryPoint,
} from "@/components/fear-greed-history-chart"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { getSentimentTone } from "@/lib/sentiment"

type FearGreedApiResponse = {
  name: string
  data: {
    value: string
    value_classification: string
    timestamp: string
    time_until_update?: string
  }[]
  metadata: {
    error: string | null
  }
}

type FearGreedDataset = {
  latest: {
    value: number
    classification: string
    timestamp: number
    timeUntilUpdate?: number | null
  } | null
  previous: {
    value: number
    timestamp: number
  } | null
  history: FearGreedHistoryPoint[]
}

type CoinSnapshot = {
  symbol: string
  name: string
  price: number
  percentChange24h: number
}

const SENTIMENT_ENDPOINT =
  "https://api.alternative.me/fng/?format=json&limit=30"

export default async function SentimentPage() {
  await auth.protect()
  const user = await currentUser()
  const sentiment = await fetchFearGreedDataset()
  const coinSnapshots = await fetchCoinSnapshots()

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

  const latest = sentiment.latest
  const tone = getSentimentTone(latest?.classification, latest?.value)
  const previousValue = sentiment.previous?.value ?? null
  const pointDelta =
    latest && typeof previousValue === "number"
      ? latest.value - previousValue
      : null
  const relativeUpdated = latest
    ? formatRelativeTime(new Date(latest.timestamp))
    : null
  const deltaText =
    typeof pointDelta === "number"
      ? `${pointDelta >= 0 ? "↑" : "↓"} ${
          Math.abs(Math.round(pointDelta)) || 0
        } point${Math.abs(Math.round(pointDelta)) === 1 ? "" : "s"}`
      : "No change"
  const deltaColor =
    typeof pointDelta === "number"
      ? pointDelta >= 0
        ? "text-emerald-400"
        : "text-red-400"
      : "text-white/70"
  const relativeUpdatedText = relativeUpdated ?? "Updating..."

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
          <div className="@container/main flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-6 py-6">
              <section className="px-4 lg:px-6">
                <div className="rounded-[32px] bg-[#1c1f26] px-6 py-8 text-white shadow-[0_28px_90px_rgba(0,0,0,0.6)] sm:px-10 sm:py-12">
                  <div className="mx-auto max-w-2xl space-y-3 text-center">
                    <p className="text-xs uppercase tracking-[0.5em] text-white/50">
                      Fear and Greed Index
                    </p>
                    <h1 className="text-4xl font-semibold">
                      Gauge real-time sentiment before you trade.
                    </h1>
                    <p className="text-base text-white/70">
                      The Fear and Greed Index helps you understand when markets are
                      fueled by fear or euphoria so you can position accordingly.
                    </p>
                  </div>
                  <div className="mx-auto mt-6 flex w-full max-w-md gap-2 rounded-2xl border border-white/10 bg-black/30 p-1 text-sm font-semibold">
                    <span className="flex-1 rounded-xl px-4 py-2 text-center text-white/45">
                      Stock Market
                    </span>
                    <span className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-gray-900">
                      Crypto
                    </span>
                  </div>
                  <div className="mt-10 flex flex-col items-center gap-6">
                    <FearGreedGauge
                      value={latest?.value ?? 0}
                      classification={latest?.classification ?? "n/a"}
                      updatedAt={
                        latest
                          ? new Date(latest.timestamp).toLocaleString()
                          : "—"
                      }
                      variant="hero"
                      showMeta={false}
                      showLabel={false}
                      className="w-full border-none bg-transparent p-0 shadow-none"
                    />
                    <div className="space-y-1 text-center">
                      <p className="text-6xl font-semibold tracking-tight">
                        {latest?.value ?? "—"}
                      </p>
                      <p className={`text-2xl font-semibold ${tone.textClass}`}>
                        {latest?.classification ?? "No data"}
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className={deltaColor}>{deltaText}</span>
                      <span className="text-white/60">{relativeUpdatedText}</span>
                    </div>
                  </div>
                  <div className="mt-10 grid gap-3 text-left text-white/80 sm:grid-cols-3">
                    {coinSnapshots.map((coin) => {
                      const isPositive = coin.percentChange24h >= 0
                      return (
                        <div
                          key={coin.symbol}
                          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-inner"
                        >
                          <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                            {coin.symbol}
                          </p>
                          <p className="text-2xl font-semibold">
                            {formatUSD(coin.price)}
                          </p>
                          <p
                            className={`text-sm font-medium ${
                              isPositive ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {isPositive ? "↑" : "↓"}{" "}
                            {formatPercent(coin.percentChange24h)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-6 text-center text-xs text-white/60">
                    Data provided by Alternative.me — Fear & Greed Index API.
                  </p>
                </div>
              </section>
              <div className="flex flex-col gap-4 px-4 pb-6 lg:px-6">
                <div className="grid gap-4 lg:grid-cols-[0.4fr_0.6fr]">
                  <Card className="border bg-card shadow-sm">
                    <CardContent className="flex h-full flex-col gap-5 p-6">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Next update ETA
                        </p>
                        <p className="text-2xl font-semibold">
                          {formatDuration(latest?.timeUntilUpdate) ?? "—"}
                        </p>
                      </div>
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Last refreshed
                          </span>
                          <span className="font-medium">
                            {latest
                              ? new Date(latest.timestamp).toLocaleString()
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Current sentiment
                          </span>
                          <span className="font-medium">
                            {latest?.classification ?? "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Data cadence
                          </span>
                          <span className="font-medium">Daily close</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Data pulled directly from the Alternative.me Fear & Greed
                        Index API. Attribution required by the provider is
                        shown whenever the data is displayed.
                      </p>
                    </CardContent>
                  </Card>
                  <div className="h-full">
                    <FearGreedHistoryChart data={sentiment.history} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

async function fetchFearGreedDataset(): Promise<FearGreedDataset> {
  try {
    const response = await fetch(SENTIMENT_ENDPOINT, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60, // hourly refresh
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to load sentiment data: ${response.status}`)
    }

    const payload = (await response.json()) as FearGreedApiResponse

    if (!payload?.data?.length) {
      return { latest: null, previous: null, history: [] }
    }

    const entries = payload.data.map((entry) => ({
      value: Number(entry.value),
      classification: entry.value_classification,
      timestamp: Number(entry.timestamp) * 1000,
      timeUntilUpdate: entry.time_until_update
        ? Number(entry.time_until_update)
        : null,
    }))

    const latest = entries[0] ?? null
    const history: FearGreedHistoryPoint[] = [...entries]
      .reverse()
      .map((entry) => ({
        value: entry.value,
        label: entry.classification,
        date: new Date(entry.timestamp).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }))

    const previous = entries[1] ?? null

    return { latest, previous, history }
  } catch (error) {
    console.error("Fear & Greed API error", error)
    return { latest: null, previous: null, history: [] }
  }
}

function formatDuration(seconds?: number | null) {
  if (!seconds || Number.isNaN(seconds)) {
    return null
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours <= 0 && minutes <= 0) {
    return "< 1 min"
  }

  if (hours <= 0) {
    return `${minutes} min`
  }

  return `${hours}h ${minutes}m`
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

async function fetchCoinSnapshots(): Promise<CoinSnapshot[]> {
  try {
    const response = await fetch(
      "https://api.alternative.me/v2/ticker/?limit=20&structure=array",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      }
    )
    if (!response.ok) return FALLBACK_COINS
    const payload = await response.json()
    const data: any[] = Array.isArray(payload?.data) ? payload.data : []
    const desired = ["bitcoin", "ethereum", "dogecoin"]
    const snapshots: CoinSnapshot[] = []
    for (const slug of desired) {
      const coin = data.find(
        (entry) =>
          entry?.website_slug?.toLowerCase() === slug ||
          entry?.name?.toLowerCase() === slug
      )
      if (coin?.quotes?.USD) {
        snapshots.push({
          symbol: coin.symbol ?? slug.slice(0, 3).toUpperCase(),
          name: coin.name ?? slug,
          price: coin.quotes.USD.price ?? 0,
          percentChange24h: coin.quotes.USD.percent_change_24h ?? 0,
        })
      }
    }
    return snapshots.length ? snapshots : FALLBACK_COINS
  } catch (error) {
    console.error("Ticker fetch failed", error)
    return FALLBACK_COINS
  }
}

const FALLBACK_COINS: CoinSnapshot[] = [
  { symbol: "BTC", name: "Bitcoin", price: 0, percentChange24h: 0 },
  { symbol: "ETH", name: "Ethereum", price: 0, percentChange24h: 0 },
  { symbol: "DOGE", name: "Dogecoin", price: 0, percentChange24h: 0 },
]

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value)
}

function formatPercent(value: number) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(value / 100)
}
