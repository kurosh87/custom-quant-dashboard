import type { CSSProperties } from "react"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import {
  IconAlertTriangle,
  IconManualGearbox,
  IconRobot,
  IconWebhook,
} from "@tabler/icons-react"

import { AppSidebar } from "@/components/app-sidebar"
import type { HistoryRow } from "@/components/history-data-table"
import { SiteHeader } from "@/components/site-header"
import { ManualApprovalSection } from "@/components/manual-approval-section"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

const TIMEFRAME_LABELS: Record<string, string> = {
  "15m": "15 Minute",
  "2h": "2 Hour",
  "4h": "4 Hour",
}

const REVIEW_SYMBOL = process.env.MANUAL_REVIEW_SYMBOL ?? "BTCUSDT"
const REVIEW_TIMEFRAME = process.env.MANUAL_REVIEW_TIMEFRAME ?? "15m"
const REVIEW_LIMIT = Number(process.env.MANUAL_REVIEW_LIMIT ?? 30)
const REVIEW_LABEL = TIMEFRAME_LABELS[REVIEW_TIMEFRAME] ?? REVIEW_TIMEFRAME

const channelSettings = [
  {
    id: "desk",
    label: "Desk digest",
    description: "Slack push to #automation-desk as soon as a signal fires.",
    cadence: "Immediate",
    active: true,
  },
  {
    id: "email",
    label: "Email summaries",
    description: "Bundle activity and deliver every hour.",
    cadence: "Hourly",
    active: true,
  },
  {
    id: "sms",
    label: "SMS failsafe",
    description: "Only ping when automation is paused or fails.",
    cadence: "Critical only",
    active: false,
  },
]

const automationPlaybooks = [
  {
    id: "btc-15m",
    title: "BTC 15m GOD_BUY",
    description: "Route to Bybit perpetuals when signal strength ≥ 4.2.",
    mode: "Automated",
    action: "Long 0.35% risk",
    timeframe: "15m",
    approvals: "No approval",
  },
  {
    id: "eth-2h",
    title: "ETH 2h Ultra swing",
    description: "Queue trades when BBWP compression < 3.5.",
    mode: "Manual",
    action: "Pending confirmation",
    timeframe: "2h",
    approvals: "Desk approval",
  },
]

export default async function NotificationsPage() {
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

  const pendingSignals = await fetchPendingSignals(REVIEW_LIMIT)
  const pendingCount = pendingSignals.length
  const strongSignals = pendingSignals.filter(
    (row) => (row.signalStrength ?? 0) >= 4
  ).length
  const avgStrength =
    pendingCount > 0
      ? (
          pendingSignals.reduce(
            (sum, row) => sum + (row.signalStrength ?? 0),
            0
          ) / pendingCount
        ).toFixed(1)
      : null
  const onlineChannels = channelSettings.filter((channel) => channel.active).length
  const manualPlaybooks = automationPlaybooks.filter(
    (playbook) => playbook.mode === "Manual"
  ).length
  const autoPlaybooks = automationPlaybooks.length - manualPlaybooks

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
        <div className="flex flex-1 flex-col px-4 py-4 md:px-8 md:py-6">
          <div className="flex flex-1 flex-col gap-6">
            <header className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                Alerts Review
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold">
                  Review signals, approve the trade, then hand it to 3Commas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Every alert lands in this queue. The desk signs off once the
                  context looks right—only then do we ship sizing to 3Commas for
                  execution.
                </p>
              </div>
            </header>

            <Card className="border border-muted-foreground/30 bg-muted/20">
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Latest {REVIEW_LABEL.toLowerCase()} signals for {REVIEW_SYMBOL} appear
                  below. Select the rows you want to approve; the rest stay in the queue.
                </p>
                <p>
                  Once approved we’ll post the details to 3Commas with the desk’s
                  standard sizing. Channels stay in sync automatically.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[3fr,1fr]">
              <div className="xl:order-1">
                <ManualApprovalSection
                  rows={pendingSignals}
                  timeframeLabel={REVIEW_LABEL}
                />
              </div>
              <Card className="order-first xl:order-2">
                <CardHeader>
                  <CardTitle>Approval workflow</CardTitle>
                  <CardDescription>
                    How a signal becomes an executable order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                    <IconRobot className="mt-0.5 size-5 text-emerald-600 dark:text-emerald-200" />
                    <div>
                      <p className="font-semibold">1. Validate the context</p>
                      <p className="text-muted-foreground">
                        Confirm oscillator alignments, compression, and BBWP notes
                        in the row details.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-2xl border border-dashed border-yellow-300/80 p-4 dark:border-yellow-900/50">
                    <IconManualGearbox className="mt-0.5 size-5 text-yellow-600 dark:text-yellow-300" />
                    <div>
                      <p className="font-semibold">2. Approve or hold</p>
                      <p className="text-muted-foreground">
                        Select rows in the table and mark them approved. Anything
                        left unchecked stays on the desk.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-900/10">
                    <IconWebhook className="mt-0.5 size-5 text-indigo-600 dark:text-indigo-200" />
                    <div>
                      <p className="font-semibold">3. Send to 3Commas</p>
                      <p className="text-muted-foreground">
                        Approved rows are posted to the 3Commas execution bot with
                        the configured sizing rules.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                    <IconAlertTriangle className="mt-0.5 size-5 text-amber-500" />
                    <div>
                      <p className="font-semibold">Escalations</p>
                      <p className="text-muted-foreground">
                        If approvals stall past SLA, alerts recycle to Slack and SMS
                        so nothing gets stuck before execution.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" size="sm">
                    Send selected orders to 3Commas
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="rounded-2xl border border-muted-foreground/20 bg-card p-6 text-sm text-muted-foreground">
              Alerts publish to the desk’s existing Slack, email, and SMS
              channels automatically; adjust them later from Settings once the
              approval workflow is dialed in.
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

async function fetchPendingSignals(limit: number): Promise<HistoryRow[]> {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from("signals")
    .select(
      "id, symbol, ticker, price, timeframe, timestamp, received_at, signal_type, signal_strength, signal_buy_score, signal_sell_score, compression_total_range, compression_center, compression_fib_zone, compression_perfect_setup, bbwp_value, bbwp_classification, jewel_fast, jewel_slow, jewel_high"
    )
    .eq("symbol", REVIEW_SYMBOL)
    .eq("timeframe", REVIEW_TIMEFRAME)
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error("Failed to load pending alerts", error)
    return []
  }

  return data.map((entry) => ({
    id: toStringValue(entry.id),
    symbol: entry.symbol ?? entry.ticker ?? null,
    timeframe: entry.timeframe ?? REVIEW_TIMEFRAME,
    timestamp: entry.timestamp ?? null,
    recordedAt: entry.received_at ?? null,
    price: typeof entry.price === "number" ? entry.price : null,
    btcDeltaPercent: null,
    signalType: entry.signal_type ?? null,
    signalStrength:
      typeof entry.signal_strength === "number"
        ? entry.signal_strength
        : null,
    buyScore:
      typeof entry.signal_buy_score === "number"
        ? entry.signal_buy_score
        : null,
    sellScore:
      typeof entry.signal_sell_score === "number"
        ? entry.signal_sell_score
        : null,
    compressionRange:
      typeof entry.compression_total_range === "number"
        ? entry.compression_total_range
        : null,
    compressionCenter:
      typeof entry.compression_center === "number"
        ? entry.compression_center
        : null,
    compressionZone: entry.compression_fib_zone ?? null,
    compressionPerfectSetup:
      typeof entry.compression_perfect_setup === "boolean"
        ? entry.compression_perfect_setup
        : null,
    bbwpValue:
      typeof entry.bbwp_value === "number" ? entry.bbwp_value : null,
    bbwpClassification: entry.bbwp_classification ?? null,
    jewelFast:
      typeof entry.jewel_fast === "number" ? entry.jewel_fast : null,
    jewelSlow:
      typeof entry.jewel_slow === "number" ? entry.jewel_slow : null,
    jewelHigh:
      typeof entry.jewel_high === "number" ? entry.jewel_high : null,
    payload: null,
  }))
}

function toStringValue(value: unknown) {
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toString()
  return value ? String(value) : Math.random().toString(36).slice(2)
}
