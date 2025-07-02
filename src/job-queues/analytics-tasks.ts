import type { TaskConfig, Payload } from 'payload'
import type { AnalyticsPluginOptions } from '../types.js'

// Helper: Count by field
function countBy<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce(
    (acc, item) => {
      const value = String(item[key] ?? 'unknown')
      acc[value] = (acc[value] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

// Hourly aggregation job
export async function runHourlyAggregation(
  payload: Payload,
  pluginOptions: AnalyticsPluginOptions,
  data: any,
) {
  const { collectionSlug = 'analytics' } = pluginOptions
  const sessionsCollection = `${collectionSlug}-sessions`
  const eventsCollection = `${collectionSlug}-events`
  const hourlyAggCollection = `${collectionSlug}-hourly-aggregations`

  // Determine hour window
  const date = data?.date ? new Date(data.date) : new Date()
  const hour = typeof data?.hour === 'number' ? data.hour : date.getHours()
  const start = new Date(date)
  start.setHours(hour, 0, 0, 0)
  const end = new Date(start)
  end.setHours(start.getHours() + 1)

  // Fetch sessions for this hour
  const sessionsRes = await payload.find({
    collection: sessionsCollection,
    where: {
      session_start: {
        greater_than_equal: start,
        less_than: end,
      },
    },
    limit: 0,
  })
  const sessions = sessionsRes.docs

  // Fetch events for this hour
  const eventsRes = await payload.find({
    collection: eventsCollection,
    where: {
      timestamp: {
        greater_than_equal: start,
        less_than: end,
      },
    },
    limit: 0,
  })
  const events = eventsRes.docs

  // Aggregate stats
  const uniqueVisitors = new Set(sessions.map((s: any) => s.ip_hash)).size
  const browsers = countBy(sessions, 'browser')
  const devices = countBy(sessions, 'device_type')
  const operating_systems = countBy(sessions, 'os')
  const countries = countBy(sessions, 'country')

  // Upsert aggregation record
  const existing = await payload.find({
    collection: hourlyAggCollection,
    where: {
      date: { equals: start.toISOString().split('T')[0] },
      hour: { equals: hour },
    },
    limit: 1,
  })

  const aggData = {
    date: start.toISOString().split('T')[0],
    hour,
    total_sessions: sessions.length,
    total_events: events.length,
    unique_visitors: uniqueVisitors,
    browsers,
    devices,
    operating_systems,
    countries,
  }

  if (existing.docs.length > 0) {
    await payload.update({
      collection: hourlyAggCollection,
      id: existing.docs[0].id,
      data: aggData,
    })
  } else {
    await payload.create({
      collection: hourlyAggCollection,
      data: aggData,
    })
  }
}

// Daily aggregation job
export async function runDailyAggregation(
  payload: Payload,
  pluginOptions: AnalyticsPluginOptions,
  data: any,
) {
  const { collectionSlug = 'analytics' } = pluginOptions
  const sessionsCollection = `${collectionSlug}-sessions`
  const eventsCollection = `${collectionSlug}-events`
  const dailyAggCollection = `${collectionSlug}-daily-aggregations`

  // Determine day window
  const date = data?.date ? new Date(data.date) : new Date()
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 1)

  // Fetch sessions for this day
  const sessionsRes = await payload.find({
    collection: sessionsCollection,
    where: {
      session_start: {
        greater_than_equal: start,
        less_than: end,
      },
    },
    limit: 0,
  })
  const sessions = sessionsRes.docs

  console.log('sessionsRes', sessionsRes)

  // Fetch events for this day
  const eventsRes = await payload.find({
    collection: eventsCollection,
    where: {
      timestamp: {
        greater_than_equal: start,
        less_than: end,
      },
    },
    limit: 0,
  })
  const events = eventsRes.docs

  // Aggregate stats
  const uniqueVisitors = new Set(sessions.map((s: any) => s.ip_hash)).size
  const browsers = countBy(sessions, 'browser')
  const devices = countBy(sessions, 'device_type')
  const operating_systems = countBy(sessions, 'os')
  const countries = countBy(sessions, 'country')

  // Top pages (by path)
  const topPagesMap: Record<string, number> = {}
  events.forEach((e: any) => {
    if (e.path) {
      topPagesMap[e.path] = (topPagesMap[e.path] || 0) + 1
    }
  })
  const top_pages = Object.entries(topPagesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }))

  // UTM sources
  const utmSourcesMap: Record<string, number> = {}
  sessions.forEach((s: any) => {
    if (s.utm && s.utm.source) {
      utmSourcesMap[s.utm.source] = (utmSourcesMap[s.utm.source] || 0) + 1
    }
  })
  const utm_sources = Object.entries(utmSourcesMap).map(([source, count]) => ({ source, count }))

  // Upsert aggregation record
  const existing = await payload.find({
    collection: dailyAggCollection,
    where: {
      date: { equals: start.toISOString().split('T')[0] },
    },
    limit: 1,
  })

  const aggData = {
    date: start.toISOString().split('T')[0],
    total_sessions: sessions.length,
    total_events: events.length,
    unique_visitors: uniqueVisitors,
    browsers,
    devices,
    operating_systems,
    countries,
    top_pages,
    utm_sources,
  }

  if (existing.docs.length > 0) {
    await payload.update({
      collection: dailyAggCollection,
      id: existing.docs[0].id,
      data: aggData,
    })
  } else {
    await payload.create({
      collection: dailyAggCollection,
      data: aggData,
    })
  }
}

// Cleanup old aggregations job
export async function cleanupOldAggregations(
  payload: Payload,
  pluginOptions: AnalyticsPluginOptions,
) {
  const { collectionSlug = 'analytics', aggregationRetention = {} } = pluginOptions
  const hourlyAggCollection = `${collectionSlug}-hourly-aggregations`
  const dailyAggCollection = `${collectionSlug}-daily-aggregations`

  // Calculate cutoff dates
  const now = new Date()
  const hourlyCutoff = new Date(now)
  hourlyCutoff.setDate(now.getDate() - (aggregationRetention.hourly ?? 7))
  const dailyCutoff = new Date(now)
  dailyCutoff.setDate(now.getDate() - (aggregationRetention.daily ?? 90))

  // Delete old hourly aggregations
  await payload.delete({
    collection: hourlyAggCollection,
    where: {
      date: { less_than: hourlyCutoff.toISOString().split('T')[0] },
    },
  })

  // Delete old daily aggregations
  await payload.delete({
    collection: dailyAggCollection,
    where: {
      date: { less_than: dailyCutoff.toISOString().split('T')[0] },
    },
  })
}

// Helper to return all analytics job task configs
export function getAnalyticsTasks(pluginOptions: AnalyticsPluginOptions): TaskConfig[] {
  const { collectionSlug = 'analytics' } = pluginOptions
  return [
    {
      slug: `${collectionSlug}_aggregate_hourly`,
      handler: async (args: any) => {
        await runHourlyAggregation(args.req.payload, pluginOptions, args.data)
        return { output: {} }
      },
    },
    {
      slug: `${collectionSlug}_aggregate_daily`,
      handler: async (args: any) => {
        await runDailyAggregation(args.req.payload, pluginOptions, args.data)
        return { output: {} }
      },
    },
    {
      slug: `${collectionSlug}_cleanup_aggregations`,
      handler: async (args: any) => {
        await cleanupOldAggregations(args.req.payload, pluginOptions)
        return { output: {} }
      },
    },
  ]
}
