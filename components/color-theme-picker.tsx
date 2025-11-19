"use client"

import { IconPalette } from "@tabler/icons-react"

import type { ColorTheme } from "@/components/color-theme-provider"
import {
  colorThemeOptions,
  useColorTheme,
} from "@/components/color-theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const palettePreview: Record<
  ColorTheme,
  { background: string; foreground: string; accent: string }
> = {
  neutral: {
    background: "#f4f4f5",
    foreground: "#09090b",
    accent: "#18181b",
  },
  stone: {
    background: "#f5f5f4",
    foreground: "#1c1917",
    accent: "#57534e",
  },
  zinc: { background: "#fafafa", foreground: "#18181b", accent: "#3f3f46" },
  gray: { background: "#f8fafc", foreground: "#0f172a", accent: "#475569" },
  slate: { background: "#f1f5f9", foreground: "#0f172a", accent: "#475569" },
  rose: { background: "#fff1f2", foreground: "#881337", accent: "#f43f5e" },
  violet: { background: "#f5f3ff", foreground: "#4c1d95", accent: "#8b5cf6" },
  emerald: { background: "#ecfdf5", foreground: "#064e3b", accent: "#10b981" },
  blue: { background: "#eff6ff", foreground: "#1e3a8a", accent: "#3b82f6" },
  amber: { background: "#fffbeb", foreground: "#92400e", accent: "#f59e0b" },
}

export function ColorThemePicker() {
  const { colorTheme, setColorTheme } = useColorTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium"
        >
          <IconPalette className="size-4" />
          <span className="hidden sm:inline">Colors</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl">
        <div className="px-3 py-2 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Color system
          </p>
          <p className="text-xs text-muted-foreground">
            Switch the dashboard palette.
          </p>
        </div>
        <DropdownMenuRadioGroup
          value={colorTheme}
          onValueChange={(value) => setColorTheme(value as ColorTheme)}
          className="grid gap-1 px-1"
        >
          {colorThemeOptions.map((option) => {
            const preview = palettePreview[option.value]
            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="relative h-10 w-16 overflow-hidden rounded-md border border-border/60"
                    style={{
                      background: `linear-gradient(135deg, ${preview.background}, ${preview.accent})`,
                    }}
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
                      style={{ color: preview.foreground }}
                    >
                      Aa
                    </span>
                    <span
                      className="absolute bottom-1 right-1 size-3 rounded-full border border-white/60"
                      style={{ backgroundColor: preview.accent }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </div>
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            setColorTheme("neutral")
          }}
        >
          Reset to Neutral
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
