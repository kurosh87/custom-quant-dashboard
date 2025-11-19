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
    <Tabs value={value} onValueChange={setValue}>
      {TIMEFRAMES.map((tf) => (
        <TabsContent key={tf.value} value={tf.value}>
          <HistoryDataTable
            rows={datasets[tf.value] ?? []}
            toolbarExtras={
              <TabsList>
                {TIMEFRAMES.map((listTf) => (
                  <TabsTrigger key={listTf.value} value={listTf.value}>
                    {listTf.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
