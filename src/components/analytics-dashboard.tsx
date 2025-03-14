// import '../styles/input.css'
import '../styles/output.css'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
// @ts-expect-error next/navigation can only be used in nextjs app directory
import { redirect } from 'next/navigation'

import type { DashboardData } from '../actions/get-dashboard-stats.js'
import type { AnalyticsPluginOptions, DateRange } from '../types.js'

import { getDashboardData } from '../actions/get-dashboard-stats.js'
import { cn } from '../utils/class-utils.js'
import { getDateFrom } from '../utils/date-utils.js'
import { BrowsersCard } from './ui/analytics-cards/browsers.js'
import { DevicesCard } from './ui/analytics-cards/devices.js'
import { OperatingSystemsCard } from './ui/analytics-cards/os.js'
import { StatCardBase } from './ui/analytics-cards/stats.js'
import { TopPagesLast7DaysCard } from './ui/analytics-cards/top-pages-last-7-days.js'
import { TopReferrersCard } from './ui/analytics-cards/top-referrers.js'
import { UTMTrackingCard } from './ui/analytics-cards/utm-tracking.js'
import { ViewsAndVisitorsCard } from './ui/analytics-cards/views-and-visitors.js'
import { VisitorGeographyCard } from './ui/analytics-cards/visitor-geography.js'
import { SelectDateRange } from './ui/select-date-range.js'

// import { redirect } from 'next/navigation';
import type { AdminViewProps, BasePayload } from 'payload'

const FlexRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      'tw-flex tw-flex-col sm:tw-flex-row tw-w-full tw-justify-between tw-gap-4',
      className,
    )}
  >
    {children}
  </div>
)

export async function AnalyticsDashboard({
  initPageResult,
  params,
  payload,
  pluginOptions,
  searchParams,
}: {
  payload: BasePayload
  pluginOptions: AnalyticsPluginOptions
} & AdminViewProps) {
  /**
   * https://payloadcms.com/docs/admin/views#collection-views
   *
   * Custom views are public
   *
   * Custom views are public by default.
   * If your view requires a user to be logged in or to have certain access rights,
   * you should handle that within your view component yourself.
   */
  const user = initPageResult?.req?.user

  if (!user) {
    redirect('/admin')
  }

  let data: DashboardData | null = null

  try {
    const result = await getDashboardData(payload, pluginOptions, {
      date_change: getDateFrom(searchParams)?.date_change,
      date_from: getDateFrom(searchParams)?.date_from,
      date_range: searchParams?.date_range as DateRange,
    })

    data = result.data
  } catch (error) {
    console.error(error)
  }

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n as any}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      viewActions={[]}
      visibleEntities={initPageResult.visibleEntities || {}}
    >
      <Gutter>
        {data ? (
          <div className="tw-flex tw-flex-col tw-gap-4 tw-pb-10">
            <div className="tw-flex tw-flex-col tw-w-full tw-space-y-4">
              <FlexRow>
                <h1 className="tw-text-2xl tw-font-bold tw-text-red-600">Analytics Dashboard</h1>
                <SelectDateRange maxAgeInDays={pluginOptions.maxAgeInDays} />
              </FlexRow>
            </div>
            <div className={`tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-w-full tw-gap-4`}>
              <StatCardBase
                change={data?.webpage_views?.change}
                label="Webpage Views"
                value={data?.webpage_views?.value}
              />
              <StatCardBase
                change={data?.unique_visitors?.change}
                label="Unique Visitors"
                value={data?.unique_visitors?.value}
              />
              <StatCardBase
                change={data?.bounce_rate?.change}
                label="Bounce Rate"
                value={data?.bounce_rate?.value}
              />
              <StatCardBase label="Live Visitors" value={data?.live_visitors?.value} />
            </div>
            <FlexRow>
              <ViewsAndVisitorsCard
                data={data?.views_and_visitors}
                dateRange={searchParams?.date_range as DateRange}
                xAxis="day"
              />
            </FlexRow>
            <FlexRow>
              <VisitorGeographyCard data={data?.visitor_geography} />
              <TopPagesLast7DaysCard pages={data?.top_pages} />
            </FlexRow>
            <FlexRow>
              <TopReferrersCard referrers={data?.top_referrers} />
              <UTMTrackingCard utm_tracking={data?.utm_tracking} />
            </FlexRow>
            <div
              className={cn('tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4')}
            >
              <BrowsersCard browsers={data?.browsers} />
              <DevicesCard devices={data?.devices} totalVisitors={data?.webpage_views?.value} />
              <OperatingSystemsCard operatingSystems={data?.operating_systems} />
            </div>
          </div>
        ) : (
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
            No data
          </div>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
