"use client"

import { useMemo } from "react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { getSentimentTone } from "@/lib/sentiment"

type GaugeVariant = "default" | "hero"

type FearGreedGaugeProps = {
  value: number
  classification: string
  updatedAt: string
  variant?: GaugeVariant
  showMeta?: boolean
  showLabel?: boolean
  className?: string
}

export function FearGreedGauge({
  value,
  classification,
  updatedAt,
  variant = "default",
  showMeta = true,
  showLabel = true,
  className,
}: FearGreedGaugeProps) {
  const tone = getSentimentTone(classification, value)
  const isHero = variant === "hero"

  const chartConfig = useMemo(
    () =>
      ({
        fear: {
          label: "Fear",
          color: "#22c55e",
        },
        neutral: {
          label: "Neutral",
          color: "#facc15",
        },
        greed: {
          label: "Greed",
          color: "#ef4444",
        },
      }) satisfies ChartConfig,
    []
  )

  const chartData = useMemo(() => {
    const clamped = Math.min(Math.max(value, 0), 100)
    const fearValue = Math.min(clamped, 33)
    const neutralValue = clamped > 33 ? Math.min(clamped - 33, 33) : 0
    const greedValue = clamped > 66 ? clamped - 66 : 0

    return [
      {
        fear: fearValue,
        neutral: neutralValue,
        greed: greedValue,
      },
    ]
  }, [value])

  const sentimentClass = tone.textClass
  const wrapperClasses = isHero
    ? "flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#1f2227] to-[#15171b] p-8 text-white shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
    : "flex flex-col gap-6 rounded-lg border bg-card p-6 shadow-sm"

  return (
    <div className={cn(wrapperClasses, className)}>
      {showMeta && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Fear & Greed index
            </p>
            <div className="text-3xl font-semibold leading-none">
              {value}
            </div>
            <p className={`text-sm font-medium ${sentimentClass}`}>
              {classification}
            </p>
          </div>
          <Badge variant="outline">
            0 — 100
          </Badge>
        </div>
      )}
      <div className="relative mx-auto flex w-full max-w-sm justify-center">
        <ChartContainer
          config={chartConfig}
          className="aspect-square w-full max-w-xs [&_.recharts-responsive-container]:!w-full"
        >
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              {showLabel ? (
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const valueFill = isHero
                        ? "#ffffff"
                        : "var(--foreground)"
                      const subFill = isHero
                        ? "rgba(255,255,255,0.6)"
                        : "var(--muted-foreground)"

                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 14}
                            fill={valueFill}
                            className="text-4xl font-bold"
                          >
                            {value}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 10}
                            className={`text-sm font-semibold ${sentimentClass}`}
                          >
                            {classification}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 26}
                            fill={subFill}
                            className="text-xs"
                          >
                            Updated {updatedAt}
                          </tspan>
                        </text>
                      )
                    }
                    return null
                  }}
                />
              ) : null}
            </PolarRadiusAxis>
            <RadialBar
              dataKey="fear"
              stackId="sentiment"
              cornerRadius={8}
              className="stroke-transparent stroke-2"
              fill="var(--color-fear)"
            />
            <RadialBar
              dataKey="neutral"
              stackId="sentiment"
              cornerRadius={8}
              className="stroke-transparent stroke-2"
              fill="var(--color-neutral)"
            />
            <RadialBar
              dataKey="greed"
              stackId="sentiment"
              cornerRadius={8}
              className="stroke-transparent stroke-2"
              fill="var(--color-greed)"
            />
          </RadialBarChart>
        </ChartContainer>
      </div>
      {showMeta && (
        <div className="text-muted-foreground text-xs">
          Data provided by Alternative.me — Fear & Greed Index API.
        </div>
      )}
    </div>
  )
}
