'use client'
import React, { useMemo } from 'react'

import { cn } from '../../utils/class-utils.js'
import { Badge } from './badge.js'
import { Card, CardContent, CardFooter } from './card.js'

interface StatCardProps {
  change?: number
  changeSuffix?: string
  label: string
  value?: number
}

const StatCard = ({ change, changeSuffix, label, value }: StatCardProps) => {
  const isChangeZero = change === 0
  const isPositiveChange = change && change > 0

  function formatValue(value: number | undefined) {
    return Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
      style: 'decimal',
    }).format(Number(value))
  }

  const aestheticValue = useMemo(() => {
    return formatValue(value)
  }, [value])

  const aestheticChange = useMemo(() => {
    return formatValue(change)
  }, [change])

  return (
    <Card className="tw-pt-8 tw-w-full tw-relative">
      {typeof change === 'number' && (
        <Badge
          className={cn(
            'tw-absolute tw-top-3 tw-right-3',
            !isChangeZero && isPositiveChange && 'tw-text-green-500 tw-border-green-500',
            !isChangeZero && !isPositiveChange && 'tw-text-red-500 tw-border-red-500',
            isChangeZero && 'tw-bg-gray-500',
          )}
          variant={isChangeZero ? 'neutral' : 'outline'}
        >
          {aestheticChange}
          {changeSuffix}
        </Badge>
      )}
      <CardContent className="tw-flex tw-flex-col tw-justify-center">
        <h3 className="tw-text-5xl tw-font-bold">{aestheticValue}</h3>
      </CardContent>
      <CardFooter>{label}</CardFooter>
    </Card>
  )
}

export default StatCard
