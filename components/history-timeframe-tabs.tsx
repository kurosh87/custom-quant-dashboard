"use client"

import * as React from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  HistoryDataTable,
  type HistoryRow,
} from "@/components/history-data-table"

const TIMEFRAMES = [
  { value: "15m", label: "15 Minute" },
  { value: "2h", label: "2 Hour" },
  { value: "4h", label: "4 Hour" },
]

type HistoryDatasets = Record<string, HistoryRow[]>

export function HistoryTimeframeTabs({
  datasets,
}: {
  datasets: HistoryDatasets
}) {
  const [value, setValue] = React.useState(TIMEFRAMES[0].value)

  return (
    <Tabs
      value={value}
      onValueChange={setValue}
      className="gap-0"
    >
      <div className="flex items-center justify-between">
        <TabsList className="flex w-fit flex-wrap gap-2 border border-border/50 bg-muted/40 px-2 py-2">
          {TIMEFRAMES.map((tf) => (
            <TabsTrigger
              key={tf.value}
              value={tf.value}
              className="px-4 py-2"
            >
              {tf.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {TIMEFRAMES.map((tf) => (
        <TabsContent key={tf.value} value={tf.value} className="mt-0">
          <HistoryDataTable rows={datasets[tf.value] ?? []} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
