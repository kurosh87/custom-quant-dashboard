import Link from "next/link"

import {
  IconChartDots3,
  IconCode,
  IconGauge,
  IconUsers,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    title: "Model faster",
    description:
      "Reusable research blocks, shared datasets, and collaborative notebooks cut discovery time to minutes.",
    icon: IconCode,
  },
  {
    title: "Deploy with confidence",
    description:
      "Push a tested strategy to production with one click. Rollbacks and guardrails are baked in.",
    icon: IconGauge,
  },
  {
    title: "Stay in sync",
    description:
      "Live dashboards show capital allocation, risk drift, and execution health across every venue.",
    icon: IconChartDots3,
  },
  {
    title: "Bring the team",
    description:
      "Role-based access, audit trails, and organization workspaces keep compliance simple.",
    icon: IconUsers,
  },
]

const stats = [
  { label: "Signals per day", value: "2.8M+" },
  { label: "Latency budget", value: "< 80ms" },
  { label: "Markets covered", value: "40+" },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(108,71,255,0.25),_transparent_55%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Quant Workspace
          </p>
          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Build, test, and run systematic strategies without the busywork.
            </h1>
            <p className="mx-auto max-w-3xl text-balance text-base text-muted-foreground sm:text-lg">
              Quant stitches together research notebooks, execution controls,
              and collaboration tools into one focused operating system for
              data-driven teams.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">Create an account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
          <div className="grid w-full gap-6 rounded-2xl border bg-card px-6 py-8 text-left md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-3xl font-semibold">{stat.value}</p>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-20">
        <div className="mb-12 grid gap-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Why Quant
          </p>
          <h2 className="text-3xl font-semibold">Ship strategies end-to-end</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Everything you need to ideate, validate, and ship systematic trades
            lives in one interface. No glue code, no brittle hand-offs.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <feature.icon className="size-6" />
                </div>
                <div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-16 text-center">
          <h3 className="text-3xl font-semibold">
            Ready to upgrade your quant stack?
          </h3>
          <p className="text-muted-foreground">
            Start with the free tier, connect your existing Clerk auth, and grow
            into premium execution tooling when you need it.
          </p>
          <Button size="lg" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
