'use client'

// @ts-ignore
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select.js'

export function SelectDateRange({ maxAgeInDays = 60 }: { maxAgeInDays?: number }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [dateRange, setDateRange] = useState('last_7_days')

  const dateRanges = [
    { days: 1, label: 'Last 1 day', value: 'last_1_day' },
    { days: 3, label: 'Last 3 days', value: 'last_3_days' },
    { days: 7, label: 'Last 7 days', value: 'last_7_days' },
    { days: 30, label: 'Last 30 days', value: 'last_30_days' },
    { days: 60, label: 'Last 60 days', value: 'last_60_days' },
    { days: 0, label: 'All time', value: 'all_time' },
  ]

  function handleDateRangeChange(value: string) {
    const params = new URLSearchParams(searchParams)
    setDateRange(value)
    params.set('date_range', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    const dateRange = searchParams.get('date_range')
    if (dateRange) {
      setDateRange(dateRange)
    } else {
      setDateRange('last_7_days')
    }
  }, [])

  return (
    <div className="!tw-w-[180px]">
      <Select onValueChange={handleDateRangeChange} value={dateRange}>
        <SelectTrigger className="tw-bg-card">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent className="tw-border-zinc-800">
          {dateRanges
            .filter(({ days }) => days <= maxAgeInDays)
            .map(({ label, value }) => (
              <SelectItem className="tw-bg-card" key={value} value={value}>
                {label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}
