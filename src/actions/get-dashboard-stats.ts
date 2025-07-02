import type { BasePayload } from 'payload'

import type { AnalyticsPluginOptions, CountryData, TableParams } from '../types.js'

// Percentage Change = (Length of Dataset A - Length of Dataset B) / Length of Dataset B * 100

export interface DashboardData {
  bounce_rate: { change: number; value: number }
  /** In a given date range; default 7 days */
  browsers: { browser: string; fill: string; visitors: number }[]
  devices: Record<string, number | string>[]
  live_visitors: { change: number; value: number }
  /** In a given date range; default 7 days */
  operating_systems: { fill: string; os: string; visitors: number }[]
  /** In a given date range; default 7 days */
  top_pages: { change: number; path: string; value: number }[]
  /** In a given date range; default 7 days */
  top_referrers: { count: number; domain: string; label: string }[]
  unique_visitors: { change: number; value: number }
  /** In a given date range; default 7 days */
  utm_tracking: {
    campaign: string
    medium: string
    source: string
    visitors: number
  }[]
  views_and_visitors: any[]
  visitor_geography: CountryData[]
  webpage_views: { change: number; value: number }
}

export class DashboardStats {
  data: any[]
  opts: TableParams
  rangeData: any[]
  constructor(data: any[], rangeData: any[], opts: TableParams) {
    this.data = data
    this.rangeData = rangeData
    this.opts = opts
  }

  static getDayFromDate(date: Date) {
    return date.toISOString().split('T')[0]
  }

  static getHourFromDate(date: Date) {
    const hour = date.getHours()
    const day = date.getDate()
    const month = date.getMonth() + 1
    return `${hour}h ${day}/${month}`
  }

  parse(): DashboardData {
    return {
      bounce_rate: this.bounce_rate,
      browsers: this.browsers,
      devices: this.devices,
      live_visitors: this.live_visitors,
      operating_systems: this.operating_systems,
      top_pages: this.top_pages,
      top_referrers: this.top_referrers,
      unique_visitors: this.unique_visitors,
      utm_tracking: this.utm_tracking,
      views_and_visitors: this.views_and_visitors,
      visitor_geography: this.visitor_geography,
      webpage_views: this.webpage_views,
    } as DashboardData
  }

  get bounce_rate() {
    return {
      change: 0,
      value: 0,
    }
  }

  get browsers() {
    const map = new Map<string, number>()
    this.data.forEach((item) => {
      if (!item?.browser) {
        return
      }
      map.set(item.browser, (map.get(item.browser) || 0) + 1)
    })

    const total = Object.fromEntries(map)
    return Object.entries(total)
      .sort((a, b) => a[1] - b[1])
      .map(([browser, visitors], i) => ({
        browser: browser.toLowerCase(),
        fill: `hsl(var(--chart-${i + 1}))`,
        visitors,
      }))
  }

  get devices() {
    const map = new Map<string, number>()
    this.data.forEach((item) => {
      if (!item?.device_type) {
        return
      }
      map.set(item.device_type, (map.get(item.device_type) || 0) + 1)
    })

    const total = Object.fromEntries(map)

    return Object.entries(total).reduce(
      (acc, [device, visitors], i) => {
        acc.push({
          [device.toLowerCase()]: visitors,
          fill: `hsl(var(--chart-${i + 1}))`,
        })
        return acc
      },
      [] as DashboardData['devices'],
    )
  }

  get live_visitors() {
    const MINUTES_AGO = 30
    const visitors = new Set<string>()
    // assume client has been on the site for last 30 minutes
    const liveLimit = new Date(Date.now() - MINUTES_AGO * 60 * 1000).toISOString()
    this.data.forEach((item) => {
      if (!item?.createdAt) {
        return
      }
      if (item.createdAt > liveLimit) {
        visitors.add(item.ip_hash)
      }
    })
    return {
      value: visitors.size,
    }
  }

  get operating_systems() {
    const map = new Map<string, number>()
    this.data.forEach((item) => {
      if (!item?.os) {
        return
      }
      map.set(item.os, (map.get(item.os) || 0) + 1)
    })

    const total = Object.fromEntries(map)

    return Object.entries(total)
      .sort((a, b) => a[1] - b[1])
      .map(([os, visitors], i) => ({
        fill: `hsl(var(--chart-${i + 1}))`,
        os: os.toLowerCase(),
        visitors,
      }))
  }

  get top_pages() {
    const map = new Map<string, number>()
    this.data.forEach((item) => {
      if (!item?.path) {
        return
      }
      map.set(item.path, (map.get(item.path) || 0) + 1)
    })

    const total = Object.fromEntries(map)

    return Object.entries(total)
      .sort((a, b) => b[1] - a[1])
      .map(([path, value], i) => ({
        change: 0,
        path,
        value,
      }))
      .slice(0, 10)
  }

  get top_referrers() {
    // referrer_url
    const map = new Map<string, number>()
    this.data.forEach((item) => {
      // make sure the referrer_url is a valid URL
      if (!item?.referrer_url) {
        return
      }

      map.set(item.referrer_url, (map.get(item.referrer_url) || 0) + 1)
    })

    return Array.from(map.entries())
      .map(([referrer, value]) => {
        let domain = ''
        if (referrer.includes('http')) {
          try {
            const url = new URL(referrer)
            domain = `${url.protocol}//${url.host}`
          } catch (error) {
            console.error(error)
          }
        }

        return {
          count: value,
          domain,
          label: referrer,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  get unique_visitors() {
    const set = new Set<string>()
    const rangeSet = new Set<string>()
    this.data.forEach((item) => {
      if (!item?.ip_hash) {
        return
      }
      set.add(item.ip_hash)
    })
    this.rangeData.forEach((item) => {
      rangeSet.add(item.ip_hash)
    })

    return {
      change: calculatePercentageChange(rangeSet.size, set.size),
      value: set.size,
    }
  }

  get utm_tracking() {
    const campaigns = new Map<
      string,
      { campaign: string; medium: string; source: string; visitors: number }
    >()
    this.data.forEach((item) => {
      if (!item?.session_id) {
        return
      }
      if (item.session_id?.utm?.campaign) {
        const key = `${item.session_id.utm.campaign}-${item.session_id.utm.medium}-${item.session_id.utm.source}-${item.session_id.utm.term}-${item.session_id.utm.content}`

        campaigns.set(key, {
          campaign: item.session_id.utm.campaign,
          medium: item.session_id.utm.medium,
          source: item.session_id.utm.source,
          visitors: (campaigns.get(key)?.visitors || 0) + 1,
        })
      }
    })

    return Array.from(campaigns.entries()).map(([key, { campaign, medium, source, visitors }]) => ({
      campaign,
      medium,
      source,
      visitors,
    }))
  }

  get views_and_visitors() {
    const map = new Map<string, { views: number; visitors: Set<string> }>()

    if (this.opts.date_range === 'last_1_day' || this.opts.date_range === 'last_3_days') {
      let hours = 24
      if (this.opts.date_range === 'last_3_days') {
        hours = 72
      }

      for (let i = hours; i > 0; i--) {
        const hour = DashboardStats.getHourFromDate(new Date(Date.now() - i * 60 * 60 * 1000))
        if (!map.has(hour)) {
          map.set(hour, {
            views: 0,
            visitors: new Set<string>(),
          })
        }
      }

      this.data.forEach((item) => {
        const itemHour = DashboardStats.getHourFromDate(new Date(item.createdAt))
        if (map.has(itemHour)) {
          const _item = map.get(itemHour)
          if (_item) {
            _item.visitors.add(item.ip_hash)
            _item.views++
          }
        }
      })
    } else if (this.opts.date_range === 'last_7_days') {
      for (let i = 7; i >= 0; i--) {
        const day = DashboardStats.getDayFromDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000))
        map.set(day, { views: 0, visitors: new Set<string>() })
      }

      this.data.forEach((item) => {
        if (!item?.createdAt) {
          return
        }
        const itemDay = DashboardStats.getDayFromDate(new Date(item.createdAt))
        if (map.has(itemDay)) {
          const _item = map.get(itemDay)
          if (_item) {
            _item.visitors.add(item.ip_hash)
            _item.views++
          }
        }
      })
    } else {
      this.data.forEach((item) => {
        if (!item?.createdAt) {
          return
        }
        const createdAt = new Date(item.createdAt).toISOString().split('T')[0]

        if (map.has(createdAt)) {
          const _item = map.get(createdAt)
          if (_item) {
            _item.visitors.add(item.ip_hash)
            _item.views++
          }
        } else {
          map.set(createdAt, { views: 0, visitors: new Set<string>() })
        }
      })
    }

    return Array.from(map.entries())
      .map(([date, { views, visitors }]) => ({
        day: date,
        views,
        visitors: visitors.size,
      }))
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
  }

  get visitor_geography() {
    const countryMap = new Map<string, number>()
    this.data.forEach((item) => {
      if (!item?.country) {
        return
      }
      countryMap.set(item.country, (countryMap.get(item.country) || 0) + 1)
    })

    return Array.from(countryMap.entries()).map(([countryCode, views]) => ({
      countryCode,
      views,
    }))
  }

  get webpage_views() {
    return {
      change: this.rangeData.length
        ? calculatePercentageChange(this.rangeData.length, this.data.length)
        : 0,
      value: this.data.length,
    }
  }
}

export async function getDashboardData(
  payload: BasePayload,
  pluginOptions: AnalyticsPluginOptions,
  opts: TableParams,
) {
  try {
    const { collectionSlug: slug, maxAgeInDays = 90 } = pluginOptions
    const dailyAggCollection = `${slug}-daily-aggregations`
    const hourlyAggCollection = `${slug}-hourly-aggregations`
    // Determine date range
    const today = new Date()
    // today.setHours(0, 0, 0, 0) // this break the fetch
    const startDate = opts.date_from
      ? new Date(opts.date_from)
      : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const endDate = new Date(today)
    const todayStr = today.toISOString().split('T')[0]
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    // 1. Fetch daily aggregations for the date range (excluding today)
    const dailyAggsRes = await payload.find({
      collection: dailyAggCollection,
      where: {
        date: {
          greater_than_equal: new Date(startStr),
          less_than_equal: new Date(endStr),
        },
      },
      limit: 0,
    })
    const dailyAggs = dailyAggsRes.docs
    // 2. Fetch hourly aggregations for today
    const hourlyAggsRes = await payload.find({
      collection: hourlyAggCollection,
      where: {
        date: { equals: todayStr },
      },
      limit: 0,
    })
    const hourlyAggs = hourlyAggsRes.docs
    // console.log({ dailyAggs, hourlyAggs })
    // 3. Merge and transform for dashboard
    // Helper to sum objects
    function sumInto(target: Record<string, number>, source: Record<string, number>) {
      for (const key in source) {
        target[key] = (target[key] || 0) + source[key]
      }
    }
    function sumTopPages(
      target: Record<string, number>,
      pages: { path: string; views: number }[] = [],
    ) {
      for (const { path, views } of pages) {
        target[path] = (target[path] || 0) + views
      }
    }
    function sumUTMSources(
      target: Record<string, number>,
      utms: { source: string; count: number }[] = [],
    ) {
      for (const { source, count } of utms) {
        target[source] = (target[source] || 0) + count
      }
    }

    // Build date range array
    const dateRange: string[] = []
    let d = new Date(startDate)
    while (d <= endDate) {
      dateRange.push(d.toISOString().split('T')[0])
      d.setDate(d.getDate() + 1)
    }
    dateRange.push(todayStr)

    // Merged results
    const merged = {
      views_and_visitors: [] as { day: string; views: number; visitors: number }[],
      top_pages: {} as Record<string, number>,
      browsers: {} as Record<string, number>,
      devices: {} as Record<string, number>,
      operating_systems: {} as Record<string, number>,
      countries: {} as Record<string, number>,
      utm_sources: {} as Record<string, number>,
      total_views: 0,
      total_visitors: 0,
    }
    // 4. Merge daily
    for (const day of dateRange) {
      if (day === todayStr) continue // handled below
      const daily = dailyAggs.find((a: any) => a.date === day)
      if (daily) {
        merged.views_and_visitors.push({
          day,
          views: daily.total_events,
          visitors: daily.unique_visitors,
        })
        sumInto(merged.browsers, daily.browsers || {})
        sumInto(merged.devices, daily.devices || {})
        sumInto(merged.operating_systems, daily.operating_systems || {})
        sumInto(merged.countries, daily.countries || {})
        sumTopPages(merged.top_pages, daily.top_pages || [])
        sumUTMSources(merged.utm_sources, daily.utm_sources || [])
        merged.total_views += daily.total_events || 0
        merged.total_visitors += daily.unique_visitors || 0
      } else {
        // Fallback: sum hourly for this day if available
        const hours = hourlyAggs.filter((a: any) => a.date === day)
        let views = 0
        let visitors = 0
        for (const hour of hours) {
          console.log('hour', hour)
          views += hour.total_events
          visitors += hour.unique_visitors
          sumInto(merged.browsers, hour.browsers || {})
          sumInto(merged.devices, hour.devices || {})
          sumInto(merged.operating_systems, hour.operating_systems || {})
          sumInto(merged.countries, hour.countries || {})
          sumTopPages(merged.top_pages, hour.top_pages || [])
          sumUTMSources(merged.utm_sources, hour.utm_sources || [])
        }
        merged.views_and_visitors.push({ day, views, visitors })
        merged.total_views += views
        merged.total_visitors += visitors
      }
    }

    // 5. For today, use hourly
    let todayViews = 0
    let todayVisitors = 0
    for (const hour of hourlyAggs) {
      todayViews += hour.total_events
      todayVisitors += hour.unique_visitors
      sumInto(merged.browsers, hour.browsers || {})
      sumInto(merged.devices, hour.devices || {})
      sumInto(merged.operating_systems, hour.operating_systems || {})
      sumInto(merged.countries, hour.countries || {})
      sumTopPages(merged.top_pages, hour.top_pages || [])
      sumUTMSources(merged.utm_sources, hour.utm_sources || [])
    }
    merged.views_and_visitors.push({ day: todayStr, views: todayViews, visitors: todayVisitors })
    merged.total_views += todayViews
    merged.total_visitors += todayVisitors

    // 6. Convert top_pages and utm_sources to arrays, sort, and take top N
    const top_pages = Object.entries(merged.top_pages)
      .map(([path, value]) => ({ change: 0, path, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
    const utm_tracking = Object.entries(merged.utm_sources)
      .map(([source, visitors]) => ({ campaign: '', medium: '', source, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10)

    // 7. Compose DashboardData
    const dashboardData: DashboardData = {
      bounce_rate: { change: 0, value: 0 },
      browsers: Object.entries(merged.browsers).map(([browser, visitors], i) => ({
        browser: browser.toLowerCase(),
        fill: `hsl(var(--chart-${i + 1}))`,
        visitors,
      })),
      devices: Object.entries(merged.devices).map(([device, visitors], i) => ({
        [device.toLowerCase()]: visitors,
        fill: `hsl(var(--chart-${i + 1}))`,
      })),
      live_visitors: { change: 0, value: 0 }, // Could be calculated from raw data if needed
      operating_systems: Object.entries(merged.operating_systems).map(([os, visitors], i) => ({
        fill: `hsl(var(--chart-${i + 1}))`,
        os: os.toLowerCase(),
        visitors,
      })),
      top_pages,
      top_referrers: [], // Not available in aggregation, could be added if needed
      unique_visitors: { change: 0, value: merged.total_visitors },
      utm_tracking,
      views_and_visitors: merged.views_and_visitors,
      visitor_geography: Object.entries(merged.countries).map(([countryCode, views]) => ({
        countryCode,
        views,
      })),
      webpage_views: { change: 0, value: merged.total_views },
    }

    return {
      data: dashboardData,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: true,
      message: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

function calculatePercentageChange(lengthA: number, lengthB: number) {
  // Handle division by zero
  if (lengthA === 0) {
    return 0
  }

  // Calculate percentage change
  return Math.round(((lengthB - lengthA) / lengthA) * 100 * 100) / 100
}
