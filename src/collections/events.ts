import type { CollectionConfig } from 'payload'

import type { AnalyticsPluginOptions } from '../types.js'

import { GetEvents, GetStats, TriggerAggregationEndpoint } from '../endpoints/events-endpoint.js'

export function initEventsCollection(pluginOptions: AnalyticsPluginOptions): CollectionConfig {
  const { collectionSlug: slug } = pluginOptions
  return {
    slug: `${slug}-events`,

    admin: {
      hidden: true,
    },
    endpoints: [
      GetEvents(pluginOptions),
      GetStats(pluginOptions),
      TriggerAggregationEndpoint(pluginOptions),
    ],
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
        name: 'path',
        type: 'text',
        required: true,
      },
      {
        name: 'query_params',
        type: 'text',
      },
      {
        name: 'event_type',
        type: 'select',
        options: ['page_view', 'click', 'form_submit', 'custom'],
        defaultValue: 'page_view',
        required: true,
      },
      {
        name: 'event_data',
        type: 'json',
        admin: {
          description: 'Additional data for custom events',
        },
      },
    ],
  }
}
