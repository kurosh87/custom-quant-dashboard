import type { CSSProperties } from "react"

import { auth, currentUser } from "@clerk/nextjs/server"
import {
  IconAlertTriangle,
  IconClockHour4,
  IconManualGearbox,
  IconRobot,
  IconWebhook,
} from "@tabler/icons-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

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
    description: "Bundle the last 10 triggers and deliver every hour.",
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

const manualQueue = [
  {
    id: "mq-1",
    asset: "BTC / USDT",
    timeframe: "2h",
    signal: "ULTRA_BUY",
    conviction: 0.88,
    entry: "$66,420",
    stop: "$64,950",
    target: "$69,850",
    expires: "in 6m",
  },
  {
    id: "mq-2",
    asset: "SOL / USDT",
    timeframe: "1h",
    signal: "GOD_BUY",
    conviction: 0.79,
    entry: "$181.30",
    stop: "$172.00",
    target: "$197.00",
    expires: "in 12m",
  },
]

const signalStream = [
  {
    id: "evt-1",
    title: "BTC / USDT 15m auto-filled",
    detail: "Filled 25% size via automation playbook at $66,110.",
    badge: "Filled",
  },
  {
    id: "evt-2",
    title: "ETH / USDT 2h awaiting review",
    detail: "Compression gate triggered manual approval.",
    badge: "Awaiting approval",
  },
  {
    id: "evt-3",
    title: "SOL / USDT 1h limit expiring",
    detail: "Desk must approve before timer lapses.",
    badge: "Expiring",
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

  const autoPlaybooksCount = automationPlaybooks.filter(
    (playbook) => playbook.mode === "Automated"
  ).length
  const manualPlaybooksCount =
    automationPlaybooks.length - autoPlaybooksCount
  const pendingApprovals = manualQueue.length
  const nextManualItem = manualQueue[0]
  const nextExpiry = nextManualItem?.expires ?? "—"
  const lastFilledEvent = signalStream.find(
    (event) => event.badge === "Filled"
  )

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
                Alerts & Routing
              </p>
              <div>
                <h1 className="text-2xl font-semibold">
                  Decide which signals auto-fill and which pause for review
                </h1>
                <p className="text-sm text-muted-foreground">
                  This board shows where every alert travels: first the channel
                  it pings, then whether automation is trusted or a desk lead has
                  to approve the trade.
                </p>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border border-emerald-200/40 dark:border-emerald-900/30">
                <CardHeader>
                  <CardTitle>Automation snapshot</CardTitle>
                  <CardDescription>
                    Trusted playbooks that can submit orders the moment signals
                    fire.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">Auto playbooks</dt>
                      <dd className="text-2xl font-semibold">
                        {autoPlaybooksCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Manual guardrails</dt>
                      <dd className="text-2xl font-semibold">
                        {manualPlaybooksCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Last auto-fill</dt>
                      <dd className="text-2xl font-semibold">
                        {lastFilledEvent ? lastFilledEvent.title : "Waiting"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastFilledEvent
                    ? `${lastFilledEvent.title}. Pause or edit the routing rules below.`
                    : "No auto orders have been sent in this session."}
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Approval queue snapshot</CardTitle>
                  <CardDescription>
                    Signals that are waiting for someone to click Approve.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">Pending signals</dt>
                      <dd className="text-2xl font-semibold">
                        {pendingApprovals}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Next expiry</dt>
                      <dd className="text-2xl font-semibold">{nextExpiry}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Fastest SLA</dt>
                      <dd className="text-2xl font-semibold">10m</dd>
                    </div>
                  </dl>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {nextManualItem
                    ? `${nextManualItem.asset} (${nextManualItem.signal}) will cancel if no one approves before the timer hits zero.`
                    : "The queue is clear. Manual approvals will show up here when guardrails pause a signal."}
                </CardFooter>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Routing strategy</CardTitle>
                  <CardDescription>
                    Explain to the desk how signals move from alert → decision →
                    execution.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 rounded-2xl border border-emerald-200/50 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                    <div className="rounded-full bg-emerald-600/20 p-2 text-emerald-700 dark:text-emerald-200">
                      <IconRobot className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold">Automated fills</p>
                      <p className="text-sm text-muted-foreground">
                        Signals that match risk policy place trades instantly.
                        Their fills are posted back to the channel so the team
                        can verify sizing.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-2xl border border-dashed border-yellow-300/70 p-4 dark:border-yellow-800/70">
                    <div className="rounded-full bg-yellow-500/20 p-2 text-yellow-600 dark:text-yellow-400">
                      <IconManualGearbox className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold">Manual approval</p>
                      <p className="text-sm text-muted-foreground">
                        Higher-risk frames pause here. A desk lead reviews entry,
                        stop, and target before telling automation to resume.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    Adjust the notification channels or edit playbooks, and the
                    routing view updates instantly so new teammates know what to
                    expect.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Notification channels</CardTitle>
                    <CardDescription>
                      Every alert pings at least one of these locations.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 whitespace-nowrap"
                  >
                    <IconWebhook className="size-4" />
                    Add channel
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {channelSettings.map((channel) => (
                    <div
                      key={channel.id}
                      className="rounded-2xl border border-muted-foreground/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold">
                            {channel.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {channel.description}
                          </p>
                        </div>
                        <Badge variant="outline">{channel.cadence}</Badge>
                      </div>
                      <div className="mt-3">
                        <Button
                          variant={channel.active ? "secondary" : "outline"}
                          size="sm"
                          className="w-full"
                        >
                          {channel.active ? "Enabled" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[3fr,2fr]">
              <Card className="border border-muted-foreground/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Manual approval queue</CardTitle>
                      <CardDescription>
                        Signals that are paused until a human approves.
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <IconClockHour4 className="size-4" />
                      SLA 10m
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {manualQueue.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-dashed border-muted-foreground/30 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold">
                            {request.asset}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.signal} • {request.timeframe}
                          </p>
                        </div>
                        <Badge variant="outline">{request.expires}</Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Entry</dt>
                          <dd className="font-semibold">{request.entry}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Stop</dt>
                          <dd className="font-semibold">{request.stop}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Target</dt>
                          <dd className="font-semibold">{request.target}</dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Conviction score {Math.round(request.conviction * 100)}%.
                        Approve to push the order, or skip to leave it idle.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="flex-1">
                          Approve trade
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Skip / reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Automation playbooks</CardTitle>
                    <CardDescription>
                      Each playbook specifies its signal, route, and approval
                      policy.
                    </CardDescription>
                  </div>
                  <Button size="sm">New playbook</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {automationPlaybooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      className="rounded-2xl border border-muted-foreground/20 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-base font-semibold">
                            {playbook.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {playbook.description}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            playbook.mode === "Automated"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                          }
                        >
                          {playbook.mode}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs font-medium sm:grid-cols-3">
                        <Badge variant="outline">{playbook.timeframe}</Badge>
                        <Badge variant="outline">{playbook.action}</Badge>
                        <Badge variant="outline">{playbook.approvals}</Badge>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          {playbook.mode === "Automated" ? "Pause" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1">
                          Edit rules
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent signal events</CardTitle>
                <CardDescription>
                  The audit log pairs every alert with the resulting action.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {signalStream.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-wrap items-start gap-3 rounded-2xl border border-muted-foreground/15 p-4"
                  >
                    <Badge
                      variant="secondary"
                      className={
                        event.badge === "Filled"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
                          : event.badge === "Expiring"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                      }
                    >
                      {event.badge}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.detail}
                      </p>
                    </div>
                    {event.badge !== "Filled" && (
                      <IconAlertTriangle className="size-5 text-amber-500" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
