"use client"

import * as React from "react"

import { HistoryDataTable, type HistoryRow } from "@/components/history-data-table"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function ManualApprovalSection({
  rows,
  timeframeLabel,
}: {
  rows: HistoryRow[]
  timeframeLabel: string
}) {
  const [selectedRows, setSelectedRows] = React.useState<HistoryRow[]>([])
  const [sheetRows, setSheetRows] = React.useState<HistoryRow[]>([])
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [tableKey, setTableKey] = React.useState(0)

  const hasSelection = selectedRows.length > 0

  const clearSelection = React.useCallback(() => {
    setTableKey((prev) => prev + 1)
    setSelectedRows([])
    setSheetRows([])
  }, [])

  const openSheetWithRows = (rowsToSend: HistoryRow[]) => {
    if (!rowsToSend.length) return
    setSheetRows(rowsToSend)
    setSheetOpen(true)
  }

  const handleApprove = () => {
    if (!hasSelection) return
    openSheetWithRows(selectedRows)
  }

  const handleReject = () => {
    if (!hasSelection) return
    console.log("Signals left in queue:", selectedRows)
    clearSelection()
  }

  const handleConfirmSend = () => {
    console.log("Sending to 3Commas:", sheetRows)
    setSheetOpen(false)
    clearSelection()
  }

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Manual approval queue</CardTitle>
            <CardDescription>
              Select the signals below and approve when they are ready for 3Commas.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
            <Badge variant="secondary">{timeframeLabel}</Badge>
            <span>{selectedRows.length} selected</span>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <HistoryDataTable
            key={tableKey}
            rows={rows}
            onSelectionChange={setSelectedRows}
            onApproveRow={(row) => openSheetWithRows([row])}
          />
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Only approved signals are dispatched to execution.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelection}
              onClick={handleReject}
            >
              Not approve
            </Button>
            <Button size="sm" disabled={!hasSelection} onClick={handleApprove}>
              Approve &amp; send
            </Button>
          </div>
        </CardFooter>
      </Card>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Send {sheetRows.length} signal(s) to 3Commas</SheetTitle>
            <SheetDescription>
              Review the orders below before confirming the dispatch.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto px-1 pb-4">
            {sheetRows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-muted-foreground/20 p-3 text-sm"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>
                    {row.symbol ?? row.timeframe} · {row.signalType ?? "Awaiting"}
                  </span>
                  <span>
                    {typeof row.price === "number"
                      ? `$${row.price.toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength {row.signalStrength ?? "—"} · BBWP{" "}
                  {row.bbwpValue ?? "—"} · Compression{" "}
                  {row.compressionRange?.toFixed(1) ?? "—"}
                </p>
              </div>
            ))}
            {!sheetRows.length && (
              <p className="text-sm text-muted-foreground">
                No signals selected.
              </p>
            )}
          </div>
          <SheetFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Back to queue
            </Button>
            <Button onClick={handleConfirmSend} disabled={!sheetRows.length}>
              Confirm &amp; send
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
