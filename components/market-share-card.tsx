"use client"

import {
  IconChartPie,
  IconCircle,
} from "@tabler/icons-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

type Dominance = {
  bitcoin: number | null
  ethereum: number | null
  others: number | null
}

const colors = {
  bitcoin: "text-yellow-500",
  ethereum: "text-indigo-400",
  others: "text-zinc-400",
}

export function MarketShareCard({ dominance }: { dominance: Dominance | null }) {
  const btc = dominance?.bitcoin ?? null
  const eth = dominance?.ethereum ?? null
  const others =
    dominance?.others ??
    (btc !== null && eth !== null ? Math.max(0, 100 - btc - eth) : null)

  return (
    <Card className="border border-slate-200 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <IconChartPie className="size-4" />
          Market Share Breakdown
        </div>
        <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
          Bitcoin Dominance
        </CardTitle>
        <CardDescription>
          Live market share across the top crypto assets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-col gap-2">
          <DominanceRow
            label="Bitcoin"
            colorClass={colors.bitcoin}
            value={btc}
          />
          <DominanceRow
            label="Ethereum"
            colorClass={colors.ethereum}
            value={eth}
          />
          <DominanceRow
            label="Others"
            colorClass={colors.others}
            value={others}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function DominanceRow({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number | null
  colorClass: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-200">
      <div className="flex items-center gap-2 font-medium">
        <IconCircle className={`size-3 ${colorClass}`} />
        {label}
      </div>
      <div className="font-semibold">
        {typeof value === "number" ? `${value.toFixed(1)}%` : "—"}
      </div>
    </div>
  )
}
