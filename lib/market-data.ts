type BitcoinPriceSummary = {
  value: number | null
  changePercent?: number | null
  open?: number | null
  high?: number | null
  low?: number | null
}

export async function fetchBitcoinPrice(): Promise<BitcoinPriceSummary> {
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
