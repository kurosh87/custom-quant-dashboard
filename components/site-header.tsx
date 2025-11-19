 "use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ColorThemePicker } from "@/components/color-theme-picker"
import { ThemeToggleButton } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/history": "History",
  "/sentiment": "Sentiment",
  "/traditionals": "Traditionals",
}

function getTitleFromPath(pathname: string) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  const segments = pathname.split("/").filter(Boolean)
  if (!segments.length) return "Home"
  const last = segments[segments.length - 1]
  return last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function SiteHeader() {
  const pathname = usePathname()
  const currentTitle = getTitleFromPath(pathname ?? "/")

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          Home
        </Link>
        <Separator
          orientation="vertical"
          className="mx-2 hidden text-muted-foreground data-[orientation=vertical]:h-4 md:block"
        />
        <h1 className="text-base font-medium">{currentTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ColorThemePicker />
          <ThemeToggleButton showLabel />
          <Button
            variant="outline"
            asChild
            size="sm"
            className="hidden rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium sm:flex"
          >
            <a
              href="https://github.com/kurosh87/custom-quant-dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-2"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
