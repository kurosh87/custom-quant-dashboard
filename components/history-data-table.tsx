"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const historySchema = z.object({
  id: z.string(),
  symbol: z.string().nullable(),
  timeframe: z.string().nullable(),
  timestamp: z.string().nullable(),
  recordedAt: z.string().nullable(),
  price: z.number().nullable(),
  btcDeltaPercent: z.number().nullable(),
  signalType: z.string().nullable(),
  signalStrength: z.number().nullable(),
  buyScore: z.number().nullable(),
  sellScore: z.number().nullable(),
  compressionRange: z.number().nullable(),
  compressionCenter: z.number().nullable(),
  compressionZone: z.string().nullable(),
  compressionPerfectSetup: z.boolean().nullable(),
  bbwpClassification: z.string().nullable(),
  bbwpValue: z.number().nullable(),
  jewelFast: z.number().nullable(),
  jewelSlow: z.number().nullable(),
  jewelHigh: z.number().nullable(),
  payload: z.record(z.string(), z.any()).nullable(),
})

export type HistoryRow = z.infer<typeof historySchema>

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<HistoryRow>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "symbol",
    header: "Signal",
    cell: ({ row }) => <HistoryCell item={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <div className="text-right font-semibold">
        {formatNumber(row.original.price)}
      </div>
    ),
  },
  {
    accessorKey: "btcDeltaPercent",
    header: "BTC 24h Δ",
    cell: ({ row }) => (
      <DeltaCell value={row.original.btcDeltaPercent} />
    ),
  },
  {
    id: "fibReading",
    header: "Fib Reading",
    cell: ({ row }) => (
      <FibCell
        zone={row.original.compressionZone}
        center={row.original.compressionCenter}
      />
    ),
  },
  {
    id: "jewelLines",
    header: "Jewel Lines",
    cell: ({ row }) => (
      <div className="text-xs font-medium">
        <span className="text-cyan-500">
          {formatNumber(row.original.jewelFast)}
        </span>
        {", "}
        <span className="text-pink-500">
          {formatNumber(row.original.jewelSlow)}
        </span>
        {", "}
        <span className="text-yellow-500">
          {formatNumber(row.original.jewelHigh)}
        </span>
      </div>
    ),
  },
  {
    id: "compression",
    header: "Compression",
    cell: ({ row }) => (
      <CompressionCell
        range={row.original.compressionRange}
        perfect={Boolean(row.original.compressionPerfectSetup)}
      />
    ),
  },
  {
    accessorKey: "bbwpClassification",
    header: "BBWP",
    cell: ({ row }) => {
      const value = row.original.bbwpValue
      const ma =
        typeof value === "number"
          ? Math.max(0, Math.min(100, value - 13))
          : null

      const state = (() => {
        if (value === null || Number.isNaN(value)) {
          return {
            label: "—",
            className: "text-muted-foreground",
          }
        }
        if (value >= 70) {
          return {
            label: "Expansion",
            className: "text-red-500",
          }
        }
        if (value <= 5) {
          return {
            label: "Volatility Floor",
            className: "text-sky-600",
          }
        }
        return {
          label: "Contraction",
          className: "text-amber-600",
        }
      })()

      return (
        <div className="flex flex-col text-xs">
          <span className="font-semibold">
            {typeof value === "number" ? `${value.toFixed(0)}%` : "—"}
            {ma !== null && (
              <>
                {" "}
                <span className="text-muted-foreground">
                  vs MA {ma.toFixed(0)}%
                </span>
              </>
            )}
          </span>
          <span className={state.className}>{state.label}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "compressionPerfectSetup",
    header: "Signal",
    cell: ({ row }) => {
      const signal = row.original.signalType?.toUpperCase() ?? ""
      const strength = row.original.signalStrength ?? 0
      const isSell = signal.includes("SELL")
      const isBuy = signal.includes("BUY")

      let label = "NEUTRAL"
      let className =
        "bg-muted text-muted-foreground border border-muted-foreground/40"

      if (isBuy) {
        label = strength >= 4 ? "STRONG BUY" : "BUY"
        className =
          strength >= 4
            ? "bg-emerald-600/10 text-emerald-700 border border-emerald-600/30 dark:bg-emerald-900/20 dark:text-emerald-300"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
      } else if (isSell) {
        label = strength >= 4 ? "STRONG SELL" : "SELL"
        className =
          strength >= 4
            ? "bg-red-600/10 text-red-700 border border-red-600/30 dark:bg-red-900/20 dark:text-red-200"
            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
      }

      return (
        <Badge className={`w-fit px-3 ${className}`}>
          {label}
        </Badge>
      )
    },
  },
  {
    id: "payload",
    header: "Payload",
    cell: ({ row }) => <PayloadDrawer item={row.original} />,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Pin</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<HistoryRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function HistoryDataTable({
  rows,
  timeframeLabel,
  onSelectionChange,
}: {
  rows: HistoryRow[]
  timeframeLabel: string
  onSelectionChange?: (rows: HistoryRow[]) => void
}) {
  const [data, setData] = React.useState(() => rows)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  React.useEffect(() => {
    setData(rows)
    setPagination({ pageIndex: 0, pageSize: 10 })
  }, [rows])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const selectedRows = React.useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    [table, rowSelection]
  )

  React.useEffect(() => {
    onSelectionChange?.(selectedRows)
  }, [selectedRows, onSelectionChange])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((curr) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(curr, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
        <div className="text-xl font-semibold">{timeframeLabel}</div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Filter</span>
          </Button>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No signals yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex flex-col gap-2 px-2 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div className="text-muted-foreground text-sm">
            Showing{" "}
            <span className="font-semibold">
              {table.getRowModel().rows.length}
            </span>{" "}
            of {data.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryCell({ item }: { item: HistoryRow }) {
  const primaryTime = item.timestamp ?? item.recordedAt ?? null
  const label = (item.signalType ?? "Neutral").toUpperCase()
  const strength = item.signalStrength ?? 0

  const pill = (() => {
    const base = label.includes("SELL")
    const strong = strength >= 4
    if (label.includes("BUY")) {
      return {
        text: strong ? "Strong Buy" : "Buy",
        className: strong
          ? "bg-emerald-600/10 text-emerald-600 border border-emerald-600/30"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
      }
    }
    if (label.includes("SELL")) {
      return {
        text: strong ? "Strong Sell" : "Sell",
        className: strong
          ? "bg-red-600/10 text-red-600 border border-red-600/30"
          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
      }
    }
    return {
      text: "Neutral",
      className:
        "bg-muted text-muted-foreground border border-muted-foreground/40",
    }
  })()

  return (
    <div className="flex flex-col gap-1">
      <Badge className={`w-fit px-3 text-xs font-semibold ${pill.className}`}>
        {pill.text}
      </Badge>
      <div className="text-muted-foreground text-xs leading-none">
        {formatDate(primaryTime)}
      </div>
    </div>
  )
}

function PayloadDrawer({ item }: { item: HistoryRow }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          View JSON
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80vh] min-h-[60vh]">
        <DrawerHeader>
          <DrawerTitle>{item.symbol ?? "Signal payload"}</DrawerTitle>
          <DrawerDescription>
            {formatDate(item.timestamp ?? item.recordedAt)}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <pre className="bg-muted text-muted-foreground rounded-lg p-4 text-left text-xs">
            {JSON.stringify(item.payload ?? {}, null, 2)}
          </pre>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—"
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function DeltaCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <Badge className="bg-muted text-muted-foreground">—</Badge>
    )
  }
  const positive = value >= 0
  return (
    <Badge
      className={`flex items-center gap-1 border ${
        positive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          : "border-red-500/30 bg-red-500/10 text-red-600"
      }`}
    >
      {positive ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </Badge>
  )
}

function CompressionCell({
  range,
  perfect,
}: {
  range: number | null | undefined
  perfect: boolean
}) {
  const severity = getCompressionSeverity(range, perfect)

  if (range === null || range === undefined || Number.isNaN(range)) {
    return (
      <div className="flex flex-col text-xs text-muted-foreground">
        <span>Range —</span>
      </div>
    )
  }

  return (
    <Badge className={`flex items-center gap-2 text-xs ${severity.className}`}>
      {severity.label} · {formatNumber(range)}
    </Badge>
  )
}

function getCompressionSeverity(
  range: number | null | undefined,
  perfect: boolean
) {
  if (
    perfect ||
    (range !== null &&
      range !== undefined &&
      !Number.isNaN(range) &&
      range <= 3)
  ) {
    return {
      label: "Tight",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    }
  }

  if (range === null || range === undefined || Number.isNaN(range)) {
    return {
      label: "Neutral",
      className:
        "bg-muted text-muted-foreground border border-muted-foreground/40",
    }
  }

  if (range >= 9) {
    return {
      label: "Extreme",
      className:
        "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200",
    }
  }

  return {
    label: "Neutral",
    className:
      "bg-muted text-muted-foreground border border-muted-foreground/40",
  }
}

function FibCell({
  zone,
  center,
}: {
  zone: string | null
  center: number | null | undefined
}) {
  const numericCenter =
    center === null || center === undefined || Number.isNaN(center)
      ? null
      : Number(center.toFixed(1))

  let label = zone ?? "—"
  if (label.includes("Mid")) {
    label = "Neutral"
  }

  const color =
    numericCenter !== null && numericCenter >= 50
      ? "text-red-500"
      : "text-emerald-600"

  return (
    <Badge
      className={`flex items-center gap-1 border ${
        numericCenter !== null && numericCenter >= 50
          ? "border-red-500/30 bg-red-500/10 text-red-600"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
      }`}
    >
      {numericCenter !== null && numericCenter >= 50 ? "▲" : "▼"} {label}{" "}
      {numericCenter !== null ? numericCenter : ""}
    </Badge>
  )
}
