"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"

const chartConfig = {
  fast: {
    label: "Fast",
    color: "hsl(198, 93%, 60%)",
  },
  slow: {
    label: "Slow",
    color: "hsl(330, 74%, 58%)",
  },
  high: {
    label: "High",
    color: "hsl(50, 100%, 60%)",
  },
  fib: {
    label: "Fib",
    color: "hsl(0, 70%, 55%)",
  },
} satisfies ChartConfig

export type JewelSeriesPoint = {
  timestamp: string
  fast: number
  slow: number
  high: number
  fib: number | null
}

export function JewelOscillatorChart({
  data,
  title = "Jewel Fast Line",
  description = "Scaled 0 – 100 oscillator",
  curveType = "natural",
}: {
  data: JewelSeriesPoint[]
  title?: string
  description?: string
  curveType?: "basis" | "monotone" | "natural" | "linear"
}) {
  const [range, setRange] = React.useState("120")
  const [showFib, setShowFib] = React.useState(true)
  const filtered = React.useMemo(() => {
    const limit = Number(range)
    if (!Number.isFinite(limit) || data.length <= limit) {
      return data
    }
    return data.slice(-limit)
  }, [data, range])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:flex"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="120" className="rounded-lg">
                Last 120 bars
              </SelectItem>
              <SelectItem value="60" className="rounded-lg">
                Last 60 bars
              </SelectItem>
              <SelectItem value="30" className="rounded-lg">
                Last 30 bars
              </SelectItem>
            </SelectContent>
          </Select>
          <Toggle
            pressed={showFib}
            onPressedChange={setShowFib}
            variant="outline"
            size="sm"
            className="text-xs uppercase tracking-wide"
          >
            {showFib ? "Hide Fib" : "Show Fib"}
          </Toggle>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <a
              href="https://www.tradingview.com/chart/?symbol=BINANCE:BTCUSDT"
              target="_blank"
              rel="noreferrer"
            >
              View on TradingView
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <AreaChart data={filtered}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis domain={[0, 100]} hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => value}
                />
              }
            />
            <Area
              dataKey="fast"
              type={curveType}
              fill="none"
              stroke="var(--color-fast)"
              strokeWidth={2}
            />
            <Area
              dataKey="slow"
              type={curveType}
              fill="none"
              stroke="var(--color-slow)"
              strokeWidth={2}
            />
            <Area
              dataKey="high"
              type={curveType}
              fill="none"
              stroke="var(--color-high)"
              strokeWidth={2}
            />
            {showFib && (
              <Area
                dataKey="fib"
                type="linear"
                fill="none"
                stroke="var(--color-fib)"
                strokeDasharray="6 4"
                strokeWidth={2}
              />
            )}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
