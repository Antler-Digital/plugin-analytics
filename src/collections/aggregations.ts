import type { CollectionConfig } from 'payload'
import type { AnalyticsPluginOptions } from '../types.js'

export function initHourlyAggregationsCollection(
  pluginOptions: AnalyticsPluginOptions,
): CollectionConfig {
  const { collectionSlug = 'analytics' } = pluginOptions
  return {
    slug: `${collectionSlug}-hourly-aggregations`,
    admin: { hidden: true },
    fields: [
      { name: 'date', type: 'date', required: true },
      { name: 'hour', type: 'number', required: true },
      { name: 'total_sessions', type: 'number' },
      { name: 'total_events', type: 'number' },
      { name: 'unique_visitors', type: 'number' },
      { name: 'browsers', type: 'json' },
      { name: 'devices', type: 'json' },
      { name: 'operating_systems', type: 'json' },
      { name: 'countries', type: 'json' },
      { name: 'top_pages', type: 'json' },
      { name: 'utm_sources', type: 'json' },
    ],
  }
}

export function initDailyAggregationsCollection(
  pluginOptions: AnalyticsPluginOptions,
): CollectionConfig {
  const { collectionSlug = 'analytics' } = pluginOptions
  return {
    slug: `${collectionSlug}-daily-aggregations`,
    admin: { hidden: true },
    fields: [
      { name: 'date', type: 'date', required: true },
      { name: 'total_sessions', type: 'number' },
      { name: 'total_events', type: 'number' },
      { name: 'unique_visitors', type: 'number' },
      { name: 'browsers', type: 'json' },
      { name: 'devices', type: 'json' },
      { name: 'operating_systems', type: 'json' },
      { name: 'countries', type: 'json' },
      { name: 'top_pages', type: 'json' },
      { name: 'utm_sources', type: 'json' },
    ],
  }
}
