import type { Config } from 'payload'

import type { AnalyticsPluginOptions } from './types.js'

import { initEventsCollection } from './collections/events.js'
import { initSessionsCollection } from './collections/sessions.js'
import { EventsEndpoint } from './endpoints/events-endpoint.js'
import { onInitExtension } from './utils/onInitExtension.js'
import {
  initHourlyAggregationsCollection,
  initDailyAggregationsCollection,
} from './collections/aggregations.js'
import { getAnalyticsTasks } from './job-queues/analytics-tasks.js'

export const analyticsPlugin =
  (pluginOptions: AnalyticsPluginOptions = {}) =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    const safePluginOptions: Required<AnalyticsPluginOptions> = {
      collectionSlug: pluginOptions.collectionSlug || 'analytics',
      dashboardLinkLabel: pluginOptions.dashboardLinkLabel || 'Analytics',
      dashboardSlug: pluginOptions.dashboardSlug || '/analytics',
      isServerless: pluginOptions.isServerless || true,
      maxAgeInDays: pluginOptions.maxAgeInDays || 60,
      enableAggregations: pluginOptions.enableAggregations ?? true,
      aggregationSchedule: pluginOptions.aggregationSchedule || {},
      aggregationRetention: pluginOptions.aggregationRetention || {},
      ...pluginOptions,
    }

    const { dashboardSlug, maxAgeInDays } = safePluginOptions

    if (dashboardSlug.startsWith('/')) {
      safePluginOptions.dashboardSlug = dashboardSlug.replace(/^\//, '')
    }

    const eventsCollection = initEventsCollection(safePluginOptions)
    const sessionsCollection = initSessionsCollection(safePluginOptions)

    // Register aggregation collections if enabled
    let aggregationCollections: import('payload').CollectionConfig[] = []
    let analyticsTasks: any[] = []
    if (safePluginOptions.enableAggregations) {
      aggregationCollections = [
        initHourlyAggregationsCollection(safePluginOptions),
        initDailyAggregationsCollection(safePluginOptions),
      ]
      analyticsTasks = getAnalyticsTasks(safePluginOptions)
    }

    config.endpoints = [
      ...(config.endpoints || []),
      {
        handler: EventsEndpoint(safePluginOptions).handler,
        method: 'get',
        path: '/events',
      },
    ]

    config.admin = {
      ...(config.admin || {}),

      components: {
        ...(config.admin?.components || {}),

        /**
         * Since we use a semi-private pipeline, we need to dynamically add the package name to the path
         */
        views: {
          ...(config.admin?.components?.views || {}),
          analyticsDashboard: {
            Component: {
              exportName: 'AnalyticsDashboard',
              path: `payload-plugin-analytics/rsc`,
              serverProps: {
                maxAgeInDays,
                pluginOptions: safePluginOptions,
              },
            },
            path: '/analytics',
          },
        },

        afterNavLinks: [
          ...(config.admin?.components?.afterNavLinks || []),
          {
            exportName: 'AnalyticsLink',
            path: 'payload-plugin-analytics/rsc#AnalyticsLink',
            serverProps: {
              href: `/admin/analytics`,
              label: 'Analytics',
            },
          },
        ],
      },
    }

    // initConfigJobs(config, safePluginOptions);

    config.collections = [
      ...(config.collections || []),
      eventsCollection,
      sessionsCollection,
      ...aggregationCollections,
    ]

    // Register analytics job tasks if enabled
    if (analyticsTasks.length > 0) {
      config.jobs = {
        ...(config.jobs || {}),
        tasks: [...(config.jobs?.tasks || []), ...analyticsTasks],
        // Add cron job scheduling for aggregations if not serverless
        autoRun: !safePluginOptions.isServerless
          ? [
              {
                cron: safePluginOptions.aggregationSchedule?.hourly || '0 * * * *',
                limit: 10,
                queue: `${safePluginOptions.collectionSlug}_hourly`,
              },
              {
                cron: safePluginOptions.aggregationSchedule?.daily || '0 2 * * *',
                limit: 5,
                queue: `${safePluginOptions.collectionSlug}_daily`,
              },
              {
                cron: safePluginOptions.aggregationSchedule?.cleanup || '0 3 * * 0',
                limit: 3,
                queue: `${safePluginOptions.collectionSlug}_cleanup`,
              },
            ]
          : [],
      }
    }

    config.onInit = async (payload) => {
      if (incomingConfig.onInit) {
        await incomingConfig.onInit(payload)
      }
      // Add additional onInit code by using the onInitExtension function
      onInitExtension(safePluginOptions, payload)
      // await onInitCrons(safePluginOptions, payload);
    }

    return config
  }
