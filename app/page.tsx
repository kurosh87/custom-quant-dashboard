import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Quant Dashboard Demo
          </p>
          <h1 className="text-4xl font-semibold">
            Sign in to explore the workspace
          </h1>
          <p className="text-muted-foreground">
            This demo highlights the alerts workflow, live oscillator charts,
            and approval queue. Use your Clerk test user to continue.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/sign-up">Create account</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          No marketing fluff—just auth and straight into the dashboard.
        </p>
      </div>
    </main>
  )
}
