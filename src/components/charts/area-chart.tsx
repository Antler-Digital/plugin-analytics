'use client'

import type { JSX } from 'react'

import React from 'react'
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import type { ChartConfig } from '../ui/chart.js'

import { ChartContainer } from '../ui/chart.js'

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="!tw-text-xl tw-flex tw-flex-col tw-gap-y-2 tw-items-start tw-bg-black tw-p-4">
        {payload.map((item: any) => (
          <div
            className="tw-flex tw-items-center tw-gap-x-2"
            key={item.name}
            style={{
              color: item.color,
            }}
          >
            <div className="tw-w-2 tw-h-2" style={{ backgroundColor: item.color }} />
            <span className="tw-capitalize">
              {item.name} : {item.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return null
}
export function AreaChartGraph({ data, xAxis }: { data: any[]; xAxis: string }) {
  const areas: JSX.Element[] = []
  const linearGradients: JSX.Element[] = []

  const keys = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      keys.add(key)
    })
  })
  keys.delete(xAxis)

  const configKeys = Array.from(keys).reduce((acc, key, i) => {
    const stopColour = `var(--chart-${key})`
    const color = `hsl(${stopColour})`

    acc[key] = {
      color,
      label: key,
    }

    const linearId = `linear-gradient-${key}`
    const fill = `url(#${linearId})`

    areas.push(
      <Area
        dataKey={key}
        fill={fill}
        fillOpacity={0.4}
        key={`area-key-${key}`}
        stackId={key}
        stroke={color}
        type="natural"
      />,
    )

    linearGradients.push(
      <linearGradient id={linearId} key={linearId} x1="0" x2="0" y1="0" y2="1">
        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
        <stop offset="95%" stopColor={color} stopOpacity={0.1} />
      </linearGradient>,
    )

    return acc
  }, {} as ChartConfig)

  return (
    <>
      <div className="">
        <ChartContainer className="tw-h-[250px] sm:tw-h-[400px] tw-w-full" config={configKeys}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey={xAxis}
              tickFormatter={(value) => value}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              padding={{ top: 30 }}
              tickFormatter={(value) => value}
              tickLine={false}
              tickMargin={8}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>{linearGradients}</defs>
            {areas}
          </AreaChart>
        </ChartContainer>
      </div>
    </>
  )
}
