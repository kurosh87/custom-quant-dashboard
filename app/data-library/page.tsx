import type { CSSProperties } from "react"
import path from "path"
import { promises as fs } from "fs"

import { auth, currentUser } from "@clerk/nextjs/server"

import { AppSidebar } from "@/components/app-sidebar"
import { CsvPreviewSheet, type CsvDataset } from "@/components/csv-preview-sheet"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CsvSource = {
  fileName: string
  label: string
  description: string
}

const CSV_SOURCES: CsvSource[] = [
  {
    fileName: "BINANCE_BTCUSDT, 15.csv",
    label: "BTCUSDT · 15 Minute",
    description: "High-resolution intraday feed for fast signals.",
  },
  {
    fileName: "BINANCE_BTCUSDT, 120.csv",
    label: "BTCUSDT · 2 Hour",
    description: "Mid-term positioning data for session bias.",
  },
  {
    fileName: "BINANCE_BTCUSDT, 240.csv",
    label: "BTCUSDT · 4 Hour",
    description: "Swing timeframe compression / expansion study.",
  },
]

export default async function DataLibraryPage() {
  await auth.protect()
  const user = await currentUser()
  const datasets = await Promise.all(
    CSV_SOURCES.map(async (source) => {
      try {
        return await loadCsvDataset(source)
      } catch (error) {
        console.error("Failed to load CSV", source.fileName, error)
        return null
      }
    })
  )

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
          <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                Data Library
              </p>
              <h1 className="text-3xl font-semibold">Custom BTCUSDT feeds</h1>
              <p className="text-sm text-muted-foreground">
                Each timeframe stream combines OHLC with proprietary compression metrics. Drill into the raw CSV directly from the sheet.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {datasets
                .filter((dataset): dataset is CsvDataset => dataset !== null)
                .map((dataset) => (
                  <Card key={dataset.fileName} className="flex flex-col">
                    <CardHeader className="space-y-1">
                      <CardTitle>{dataset.label}</CardTitle>
                      <CardDescription>
                        {dataset.description ?? dataset.fileName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            Latest close
                          </p>
                          <p className="text-lg font-semibold">
                            {dataset.latestClose ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            Updated
                          </p>
                          <p className="text-lg font-semibold">
                            {dataset.latestTimestamp ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {dataset.rowCount.toLocaleString()} rows · {dataset.fileName}
                      </div>
                      <div className="flex items-center">
                        <CsvPreviewSheet dataset={dataset} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

async function loadCsvDataset(source: CsvSource): Promise<CsvDataset> {
  const filePath = path.join(process.cwd(), source.fileName)
  const raw = await fs.readFile(filePath, "utf8")
  const lines = raw.trim().split(/\r?\n/).filter(Boolean)

  if (lines.length === 0) {
    return {
      label: source.label,
      description: source.description,
      fileName: source.fileName,
      headers: [],
      previewRows: [],
      rowCount: 0,
    }
  }

  const headers = normalizeHeaders(lines[0])
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",")
    const obj: Record<string, string> = {}
    headers.forEach((header, idx) => {
      obj[header] = cells[idx] ?? ""
    })
    return obj
  })

  const previewRows = rows.slice(0, 50)
  const latestRow = rows[0]
  const latestClose = latestRow?.close
    ? formatUsd(Number(latestRow.close))
    : undefined
  const latestTimestamp = latestRow?.time
    ? formatTimestamp(latestRow.time)
    : undefined

  return {
    label: source.label,
    description: source.description,
    fileName: source.fileName,
    headers,
    previewRows,
    rowCount: rows.length,
    latestClose,
    latestTimestamp,
  }
}

function normalizeHeaders(headerLine: string) {
  const rawHeaders = headerLine.split(",")
  const seen: Record<string, number> = {}

  return rawHeaders.map((header, index) => {
    const base = header.trim() || `column_${index + 1}`
    const count = (seen[base] ?? 0) + 1
    seen[base] = count
    return count > 1 ? `${base}_${count}` : base
  })
}

function formatTimestamp(value: string) {
  const asNumber = Number(value)
  if (!Number.isFinite(asNumber)) return undefined
  const date =
    asNumber > 1_000_000_000_000
      ? new Date(asNumber)
      : new Date(asNumber * 1000)
  return date.toLocaleString()
}

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return undefined
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}
