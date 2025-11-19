import type { CSSProperties } from "react"

import { auth, currentUser } from "@clerk/nextjs/server"

import { AppSidebar } from "@/components/app-sidebar"
import { TradingViewChart } from "@/components/tradingview-chart"
import { SiteHeader } from "@/components/site-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const markets = [
  {
    title: "NASDAQ Composite",
    description: "Tech-heavy barometer covering 3,000+ listings.",
    symbol: "INDEX:IXIC",
    value: "nasdaq",
    widget: {
      allow_symbol_change: false,
      hide_side_toolbar: false,
    },
  },
  {
    title: "S&P 500 ETF (SPY)",
    description: "Most liquid proxy for U.S. large caps.",
    symbol: "NYSEARCA:SPY",
    value: "spy",
    widget: {
      hide_side_toolbar: true,
    },
  },
  {
    title: "S&P 500 Index",
    description: "Benchmark cash index used for risk framing.",
    symbol: "SP:SPX",
    value: "spx",
    widget: {
      allow_symbol_change: false,
      hide_side_toolbar: false,
    },
  },
] as const

export default async function TraditionalsPage() {
  await auth.protect()
  const user = await currentUser()

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
              <div className="space-y-3 px-4 lg:px-6">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Traditionals
                </p>
                <div className="space-y-1">
                  <h1 className="text-3xl font-semibold leading-tight">
                    Equity market pulse
                  </h1>
                  <p className="text-muted-foreground">
                    Follow the flagship U.S. benchmarks directly inside your
                    Quant workspace.
                  </p>
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Benchmarks</CardTitle>
                    <CardDescription>
                      Tabs pull the official TradingView charts for each symbol.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={markets[0]!.value} className="space-y-4">
                      <TabsList className="w-full flex-wrap justify-start gap-2">
                        {markets.map((market) => (
                          <TabsTrigger key={market.value} value={market.value}>
                            {market.title}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {markets.map((market) => (
                        <TabsContent
                          key={market.value}
                          value={market.value}
                          className="space-y-4"
                        >
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold">
                              {market.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {market.description}
                            </p>
                          </div>
                          <TradingViewChart
                            symbol={market.symbol}
                            className="h-[420px]"
                            config={market.widget}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
