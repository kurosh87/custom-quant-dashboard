import {
  IconAlertTriangle,
  IconTarget,
  IconBolt,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Summary = {
  compressionRange: number | null
  compressionCenter: number | null
  compressionZone: string | null
  signalType: string | null
  signalStrength: number | null
  buyScore?: number | null
  bbwpValue: number | null
  bbwpClassification: string | null
}

type FearGreedSummary = {
  value: number | null
  classification: string | null
}

type PriceSummary = {
  value: number | null
  changePercent?: number | null
  open?: number | null
  high?: number | null
  low?: number | null
}

const BITCOIN_DOMINANCE = 56.64

export function SectionCards({
  summary,
  fearGreed,
  price,
}: {
  summary?: Summary | null
  fearGreed?: FearGreedSummary | null
  price?: PriceSummary | null
}) {
  const compressionValue =
    typeof summary?.compressionRange === "number"
      ? summary.compressionRange.toFixed(1)
      : "—"
  const compressionTight =
    typeof summary?.compressionRange === "number" &&
    summary.compressionRange <= 4
  const compressionBadge = compressionTight ? "↓ Tightening" : "↔ Stable"
  const compressionMessage = compressionTight
    ? "🔥 COMPRESSED!"
    : "Balanced ranges"
  const compressionSub =
    summary?.compressionZone ?? "Watching fib ladder"

  const hasFearGreed =
    typeof fearGreed?.value === "number" &&
    Number.isFinite(fearGreed.value) &&
    typeof fearGreed.classification === "string"

  const dominanceHistory = [
    { label: "7D", value: "+3.8%" },
    { label: "1M", value: "+1.9%" },
    { label: "1Y", value: "+0.8%" },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card border border-orange-100 dark:border-orange-400/20">
        <CardHeader>
          {hasFearGreed ? (
            <CardDescription>😨 Fear & Greed Index</CardDescription>
          ) : (
            <CardDescription>🎯 Compression</CardDescription>
          )}
          <CardTitle
            className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${
              hasFearGreed && fearGreed?.classification?.toLowerCase().includes("fear")
                ? "text-red-500"
                : hasFearGreed && fearGreed?.classification?.toLowerCase().includes("greed")
                ? "text-emerald-500"
                : "text-foreground"
            }`}
          >
            {hasFearGreed ? fearGreed?.value : compressionValue}
          </CardTitle>
          <CardAction>
            {hasFearGreed ? (
              <Badge
                variant="secondary"
                className={`${
                  fearGreed?.classification?.toLowerCase().includes("fear")
                    ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                    : fearGreed?.classification?.toLowerCase().includes("greed")
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                }`}
              >
                {fearGreed?.classification}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                <IconTarget />
                {compressionBadge}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {hasFearGreed ? (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium">
                Current sentiment{" "}
                <IconAlertTriangle className="size-4 text-amber-500" />
              </div>
              <div className="text-muted-foreground">
                Updated from Alternative.me
              </div>
            </>
          ) : (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium">
                {compressionMessage}{" "}
                <IconAlertTriangle className="size-4 text-amber-500" />
              </div>
              <div className="text-muted-foreground">{compressionSub}</div>
            </>
          )}
        </CardFooter>
      </Card>
      <Card className="@container/card border border-orange-100 dark:border-orange-400/20">
        <CardHeader>
          <CardDescription>BTC Dominance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-orange-600 dark:text-orange-300">
            {BITCOIN_DOMINANCE.toFixed(2)}%
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
              Live snapshot
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="grid w-full grid-cols-3 gap-2 text-muted-foreground">
            {dominanceHistory.map((entry) => (
              <div
                key={entry.label}
                className="rounded-lg border border-orange-200/40 p-2 text-center text-xs font-medium dark:border-orange-900/40"
              >
                <div className="text-orange-600 dark:text-orange-300">
                  {entry.value}
                </div>
                <div>{entry.label}</div>
              </div>
            ))}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card border border-emerald-100 dark:border-emerald-400/20">
        {typeof price?.value === "number" ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardDescription>₿ Current Price</CardDescription>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  Live 24h feed
                </Badge>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-emerald-600 dark:text-emerald-300">
                  ${price.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </CardTitle>
                {typeof price.changePercent === "number" && (
                  <Badge
                    variant="secondary"
                    className={`${
                      price.changePercent >= 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                    }`}
                  >
                    {price.changePercent >= 0 ? (
                      <IconTrendingUp className="size-4" />
                    ) : (
                      <IconTrendingDown className="size-4" />
                    )}
                    {Math.abs(price.changePercent).toFixed(2)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardFooter className="grid w-full grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
              <div className="rounded-md border border-emerald-200/40 p-2 text-center dark:border-emerald-900/40">
                <div className="text-[10px] uppercase tracking-wide">Open</div>
                <div className="text-foreground">
                  {price.open
                    ? `$${Number(price.open).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    : "—"}
                </div>
              </div>
              <div className="rounded-md border border-emerald-200/40 p-2 text-center dark:border-emerald-900/40">
                <div className="text-[10px] uppercase tracking-wide">High</div>
                <div className="text-foreground">
                  {price.high
                    ? `$${Number(price.high).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    : "—"}
                </div>
              </div>
              <div className="rounded-md border border-emerald-200/40 p-2 text-center dark:border-emerald-900/40">
                <div className="text-[10px] uppercase tracking-wide">Low</div>
                <div className="text-foreground">
                  {price.low
                    ? `$${Number(price.low).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    : "—"}
                </div>
              </div>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardDescription>📊 Current Signal</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {summary?.signalType ?? "—"}
              </CardTitle>
              <CardAction>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                  ⭐⭐⭐⭐⭐
                  {summary?.signalStrength
                    ? ` (${summary.signalStrength}/5)`
                    : "(waiting)"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Buy Score: {summary?.buyScore ?? "—"}
                <IconTrendingUp className="size-4 text-indigo-500" />
              </div>
              <div className="text-muted-foreground">Ready to trigger</div>
            </CardFooter>
          </>
        )}
      </Card>
      <Card className="@container/card border border-yellow-100 dark:border-yellow-400/20">
        <CardHeader>
          <CardDescription>⚡ Confluence</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            3 / 3
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
              FULL ALIGNMENT
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            15m + 2h + 4h synced <IconBolt className="size-4 text-yellow-500" />
          </div>
          <div className="text-muted-foreground">
            Oversold on all three frames
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
