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
        try {
          const url = new URL(referrer)
          domain = `${url.protocol}//${url.host}`
        } catch (error) {
          console.error(error)
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
  /** ISO string */
  opts: TableParams,
) {
  try {
    const { collectionSlug: slug } = pluginOptions
    const collection = `${slug}-events`
    const sessionsCollection = `${slug}-sessions`

    const data = await payload.find({
      // @ts-ignore
      collection,
      ...(opts.date_from && {
        where: {
          createdAt: {
            greater_than_equal: opts.date_from,
            // less_than_equal: opts.date_to, // default is today
          },
        },
      }),
      limit: parseInt(opts.limit || '10000'),
      populate: {
        [sessionsCollection]: {
          utm: true,
        },
      },
    })

    const rangeData = await payload.find({
      // @ts-ignore
      collection,
      ...(opts.date_change &&
        opts.date_from && {
          where: {
            createdAt: {
              greater_than_equal: opts.date_change,
              less_than_equal: opts.date_from,
            },
          },
        }),
      limit: parseInt(opts.limit || '1000'),
      select: {
        createdAt: true,
        ip_hash: true,
      },
    })

    const dashboardStats = new DashboardStats(data.docs, rangeData.docs, opts)

    return {
      data: dashboardStats.parse(),
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
