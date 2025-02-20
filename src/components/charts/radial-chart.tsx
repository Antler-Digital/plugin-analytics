'use client'

import React from 'react'
import { LabelList, RadialBar, RadialBarChart } from 'recharts'

import type { ChartConfig } from '../ui/chart.js'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart.js'

export function RadialChart({
  className,
  data,
  labelKey = 'browser',
}: {
  className?: string
  data: any[]
  labelKey?: string
}) {
  // create chart config
  const chartConfig = data.reduce((acc, item, i) => {
    const label = item[labelKey]
    acc[label] = {
      color: item.fill,
      label,
    }
    return acc
  }, {} as ChartConfig)

  return (
    <ChartContainer className={className} config={chartConfig}>
      <RadialBarChart
        data={data}
        endAngle={200}
        innerRadius={30}
        outerRadius={100}
        startAngle={-90}
      >
        <ChartTooltip
          content={
            <ChartTooltipContent hideLabel labelClassName="!tw-uppercase" nameKey={labelKey} />
          }
          cursor={false}
        />
        <RadialBar dataKey="visitors">
          <LabelList
            className="tw-fill-white tw-capitalize tw-mix-blend-luminosity"
            dataKey={labelKey}
            fontSize={11}
            position="insideStart"
          />
        </RadialBar>
      </RadialBarChart>
    </ChartContainer>
  )
}
