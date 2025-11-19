"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  getSentimentTone,
  SENTIMENT_GRADIENT_COLORS,
} from "@/lib/sentiment"

export type FearGreedHistoryPoint = {
  date: string
  label: string
  value: number
}

export function FearGreedHistoryChart({
  data,
}: {
  data: FearGreedHistoryPoint[]
}) {
  const latest = data.at(-1)
  const tone = getSentimentTone(latest?.label, latest?.value)
  const chartConfig = {
    index: {
      label: "Index value",
      color: tone.hex,
    },
  } satisfies ChartConfig

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            30-day sentiment progression
          </p>
          <h3 className="text-lg font-semibold">Daily closing index</h3>
        </div>
        <span className="text-muted-foreground text-xs">
          Source: Alternative.me Fear & Greed Index
        </span>
      </div>
      <ChartContainer
        config={chartConfig}
        className="mt-4 aspect-video w-full"
      >
        <AreaChart data={data}>
          <defs>
            <linearGradient
              id="fearGreedGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={SENTIMENT_GRADIENT_COLORS[0]} stopOpacity={0.25} />
              <stop offset="45%" stopColor={SENTIMENT_GRADIENT_COLORS[1]} stopOpacity={0.2} />
              <stop offset="100%" stopColor={SENTIMENT_GRADIENT_COLORS[2]} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => label as string}
                formatter={(value) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{value}</span>
                  </div>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-index)"
            fill="url(#fearGreedGradient)"
            strokeWidth={3}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
