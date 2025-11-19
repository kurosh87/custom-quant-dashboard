"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type CsvDataset = {
  label: string
  fileName: string
  description?: string
  headers: string[]
  previewRows: Record<string, string>[]
  rowCount: number
  latestClose?: string
  latestTimestamp?: string
}

export function CsvPreviewSheet({ dataset }: { dataset: CsvDataset }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border border-border/70 px-4"
        >
          View data
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-[min(100vw,1200px)] flex-col gap-8 overflow-y-auto"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{dataset.label}</SheetTitle>
          <SheetDescription className="text-xs">
            {dataset.fileName} · {dataset.rowCount.toLocaleString()} rows
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Latest snapshot
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Close</p>
                <p className="text-lg font-semibold">
                  {dataset.latestClose ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timestamp</p>
                <p className="text-lg font-semibold">
                  {dataset.latestTimestamp ?? "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  {dataset.headers.map((header) => (
                    <TableHead key={header} className="whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.previewRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {dataset.headers.map((header) => (
                      <TableCell
                        key={`${rowIndex}-${header}`}
                        className="whitespace-nowrap text-xs"
                      >
                        {row[header] ?? "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
