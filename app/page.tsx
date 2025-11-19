import Link from "next/link"

import { Button } from "@/components/ui/button"
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <InteractiveNebulaShader
        hasActiveReminders
        disableCenterDimming
        className="pointer-events-none opacity-80"
      />
      <div className="relative z-10 max-w-xl space-y-6 rounded-3xl border border-white/10 bg-background/40 p-10 backdrop-blur">
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
