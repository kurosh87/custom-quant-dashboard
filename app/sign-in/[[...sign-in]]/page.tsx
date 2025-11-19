import Link from "next/link"

import { QuantSignIn } from "@/components/quant-sign-in"
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader"

type BtcStats = {
  price: number
  pct1h: number
  pct24h: number
  marketCap: number
  volume24h: number
  updatedAt: Date
}

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 0 : 2,
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

function formatCompactUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

async function getBtcStats(): Promise<BtcStats | null> {
  try {
    const res = await fetch(
      "https://api.alternative.me/v2/ticker/bitcoin/?structure=array",
      { next: { revalidate: 300 } }
    )
    if (!res.ok) {
      return null
    }
    const json = await res.json()
    const btc = Array.isArray(json?.data) ? json.data[0] : undefined
    const usd = btc?.quotes?.USD
    if (!btc || !usd) return null

    const price = usd.price ?? 0
    const pct24 = usd.percent_change_24h ?? 0
    const pct1h = usd.percent_change_1h ?? 0

    return {
      price,
      pct1h,
      pct24h: pct24,
      marketCap: usd.market_cap ?? 0,
      volume24h: usd.volume_24h ?? 0,
      updatedAt: new Date((btc.last_updated ?? Date.now()) * 1000),
    }
  } catch (error) {
    console.error("Failed to fetch BTC stats", error)
    return null
  }
}

export default async function Page() {
  const btcStats =
    (await getBtcStats()) ?? {
      price: 0,
      pct1h: 0,
      pct24h: 0,
      marketCap: 0,
      volume24h: 0,
      updatedAt: new Date(),
    }

  const btcSnapshot = [
    {
      label: "Price",
      value: formatUSD(btcStats.price),
      delta: `${formatPercent(btcStats.pct24h)} (24h)`,
    },
    {
      label: "Market cap",
      value: formatCompactUSD(btcStats.marketCap),
    },
    {
      label: "Volume 24h",
      value: formatCompactUSD(btcStats.volume24h),
    },
    {
      label: "1h drift",
      value: formatPercent(btcStats.pct1h),
    },
  ]

  const updatedLabel = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(btcStats.updatedAt)

  return (
    <div className="grid min-h-svh w-full bg-background lg:grid-cols-2">
      <div className="relative hidden min-h-svh flex-col justify-between overflow-hidden bg-background p-10 text-white lg:flex">
        <InteractiveNebulaShader
          hasActiveReminders
          hasUpcomingReminders
          disableCenterDimming
          className="pointer-events-none opacity-90"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(108,71,255,0.35),_transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80" />
        <div className="relative z-10 flex h-full flex-col">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 backdrop-blur">
              My Quant Dashboard
            </div>
            <h2 className="text-4xl font-semibold leading-tight">
              Welcome to Quant OS.
            </h2>
            <p className="text-base text-white/70">
              BTC momentum, technical analysis, and macro sentiment.
            </p>
          </div>
          <div className="mt-auto mb-12 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur">
              <div className="flex items-center justify-between text-white/70 text-xs uppercase tracking-[0.3em]">
                <span>BTC / USD snapshot</span>
                <span className="font-mono normal-case tracking-tight text-white/60">
                  {updatedLabel} UTC
                </span>
              </div>
              <div className="grid gap-3 pt-4 sm:grid-cols-2">
                {btcSnapshot.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-white/10 bg-white/5 p-3"
                  >
                    <p className="text-xs uppercase tracking-widest text-white/60">
                      {stat.label}
                    </p>
                    <p className="font-mono text-lg text-white">
                      {stat.value}
                    </p>
                    {stat.delta ? (
                      <p className="text-xs text-emerald-300">{stat.delta}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/55">
          Designed with love by Pejman.io
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Welcome back
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Sign in to Quant
            </h1>
            <p className="text-sm text-muted-foreground">
              Secure access powered by Clerk. Continue where your desk left off.
            </p>
          </div>
          <QuantSignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
          />
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
