"use client"

import { useTheme } from "next-themes"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type TradingViewChartProps = {
  symbol: string
  interval?: string
  className?: string
  config?: Record<string, unknown>
}

export function TradingViewChart({
  symbol,
  interval = "D",
  className,
  config = {},
}: TradingViewChartProps) {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ""

    const script = document.createElement("script")
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: resolvedTheme === "dark" ? "dark" : "light",
      style: "1",
      withdateranges: true,
      hide_top_toolbar: false,
      hide_side_toolbar: true,
      allow_symbol_change: true,
      save_image: false,
      backgroundColor: resolvedTheme === "dark" ? "#0f0f0f" : "#ffffff",
      gridColor: "rgba(242, 242, 242, 0.06)",
      locale: "en",
      calendar: false,
      studies: [],
      support_host: "https://www.tradingview.com",
      hide_legend: false,
      hide_volume: false,
      show_popup_button: false,
      ...config,
    })

    containerRef.current.appendChild(script)

    return () => {
      containerRef.current?.replaceChildren()
    }
  }, [symbol, interval, resolvedTheme, config])

  return (
    <div className={cn("h-[360px] w-full", className)}>
      <div
        ref={containerRef}
        className="tradingview-widget-container h-full w-full"
      >
        <div className="tradingview-widget-container__widget h-full w-full" />
      </div>
    </div>
  )
}
