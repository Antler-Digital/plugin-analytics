import type { CollectionConfig } from 'payload'

import type { AnalyticsPluginOptions } from '../types.js'

import { GetEvents, GetStats } from '../endpoints/events-endpoint.js'

export function initEventsCollection(pluginOptions: AnalyticsPluginOptions): CollectionConfig {
  const { collectionSlug: slug } = pluginOptions
  return {
    slug: `${slug}-events`,

    admin: {
      hidden: true,
    },
    endpoints: [GetEvents(pluginOptions), GetStats(pluginOptions)],
    fields: [
      {
        name: 'timestamp',
        type: 'date',
        defaultValue: () => new Date(),
        required: true,
      },
      {
        name: 'session_id',
        type: 'relationship',
        relationTo: `${slug}-sessions`,
        required: true,
      },
      {
        name: 'domain',
        type: 'text',
        required: true,
      },
      {
        name: 'path',
        type: 'text',
        required: true,
      },
      {
        name: 'query_params',
        type: 'text',
      },
      {
        name: 'referrer_url',
        type: 'text',
      },
      {
        name: 'ip_hash',
        type: 'text',
        required: true,
      },
      {
        name: 'user_agent',
        type: 'text',
      },
      {
        name: 'device_type',
        type: 'select',
        options: ['desktop', 'mobile', 'tablet'],
      },
      {
        name: 'os',
        type: 'text',
      },
      {
        name: 'browser',
        type: 'text',
      },
      {
        name: 'country',
        type: 'text',
      },
    ],
  }
}
