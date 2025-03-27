import React from 'react'

import type { DashboardData } from '../../../actions/get-dashboard-stats.js'
import type { DateRange } from '../../../types.js'

import { AreaChartGraph } from '../../charts/area-chart.js'
import { SimpleCard } from '../../ui/simple-card.js'

export function ViewsAndVisitorsCard({
  data,
  dateRange,
  xAxis,
}: {
  data?: DashboardData['views_and_visitors']
  dateRange?: DateRange
  xAxis: string
}) {
  if (!data) {
    return null
  }

  let dateRangeLabel = 'Last 7 days'

  if (dateRange === 'last_1_day') {
    dateRangeLabel = 'Last 24 hours'
  } else if (dateRange === 'last_3_days') {
    dateRangeLabel = 'Last 3 days'
  } else if (dateRange === 'last_7_days') {
    dateRangeLabel = 'Last 7 days'
  } else if (dateRange === 'last_30_days') {
    dateRangeLabel = 'Last 30 days'
  } else if (dateRange === 'last_60_days') {
    dateRangeLabel = 'Last 60 days'
  } else if (dateRange === 'all_time') {
    dateRangeLabel = 'All time'
  }

  try {
    return (
      <SimpleCard
        action={
          <div className="tw-flex tw-flex-row tw-items-start sm:tw-items-center tw-gap-x-2">
            {/* page views key */}
            <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-2">
              <div className="tw-w-4 tw-h-4 tw-bg-[#2357C1]" />
              <div>Page Views</div>
            </div>
            {/* visitors key */}
            <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-2">
              <div className="tw-w-4 tw-h-4 tw-bg-[#D1366F]" />
              <div>Unique Visitors</div>
            </div>
          </div>
        }
        className="tw-w-full"
        content={<AreaChartGraph data={data} xAxis={xAxis} />}
        info={{
          title: 'Page Views & Visitors',
          body: (
            <div>
              A time-series visualization comparing page views and unique visitors over time. This
              chart helps identify traffic patterns, peak usage times, and the relationship between
              total views and unique visitors, useful for content scheduling and capacity planning
            </div>
          ),
        }}
        title={`Page Views and Visitors ${dateRangeLabel}`}
      />
    )
  } catch (error) {
    return null
  }
}
