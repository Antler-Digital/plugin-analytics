'use client'
import type { JSX } from 'react'

import React from 'react'
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart.js'

export function SemiRadialChart({
  className,
  data = [{ desktop: 0, mobile: 0 }],
  total,
}: {
  className?: string
  data: any[]
  total: {
    label: string
    value: number
  }
}) {
  // dynamically generate the chart config and bars
  const chart = data.reduce(
    (acc, item) => {
      const key = Object.keys(item)[0]
      if (!key) {
        return acc
      }

      // config
      acc.config[key] = {
        fill: item.fill,
        label: key,
      }

      // data
      acc.data[key] = item[key]

      // bars
      acc.bars.push(<RadialBar dataKey={key} fill={item.fill} key={key} stackId="a" />)
      return acc
    },
    {
      bars: [],
      config: {},
      data: {},
    } as {
      bars: JSX.Element[]
      config: Record<string, any>
      data: Record<string, any>
    },
  )

  return (
    <ChartContainer className={`${className} `} config={chart.config}>
      <RadialBarChart
        cy={150}
        data={[chart.data]}
        endAngle={180}
        innerRadius={80}
        outerRadius={130}
      >
        <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
        <PolarRadiusAxis axisLine={false} tick={false} tickLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                    <tspan
                      className="tw-fill-foreground tw-text-2xl tw-font-bold"
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 16}
                    >
                      {total.value.toLocaleString()}
                    </tspan>
                    <tspan
                      className="tw-fill-muted-foreground"
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 4}
                    >
                      {total.label}
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
        {chart.bars}
      </RadialBarChart>
    </ChartContainer>
  )
}
