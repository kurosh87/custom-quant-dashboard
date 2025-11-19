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
      className="flex flex-col gap-4"
    >
      <div className="px-4 lg:px-6">
        <TabsList className="flex w-fit flex-wrap gap-2">
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
          <HistoryDataTable
            rows={datasets[tf.value] ?? []}
            timeframeLabel={tf.label}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
