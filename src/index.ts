import type { Config } from 'payload'

import type { AnalyticsPluginOptions } from './types.js'

import { initEventsCollection } from './collections/events.js'
import { initSessionsCollection } from './collections/sessions.js'
import { EventsEndpoint } from './endpoints/events-endpoint.js'
import { onInitExtension } from './utils/onInitExtension.js'

export const analyticsPlugin =
  (pluginOptions: AnalyticsPluginOptions = {}) =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    const safePluginOptions: Required<AnalyticsPluginOptions> = {
      collectionSlug: 'analytics',
      dashboardLinkLabel: 'Analytics',
      dashboardSlug: '/analytics',
      isServerless: true,
      maxAgeInDays: 60,
      ...pluginOptions,
    }

    const { dashboardLinkLabel, dashboardSlug, maxAgeInDays } = safePluginOptions

    if (dashboardSlug.startsWith('/')) {
      safePluginOptions.dashboardSlug = dashboardSlug.replace(/^\//, '')
    }

    const eventsCollection = initEventsCollection(safePluginOptions)
    const sessionsCollection = initSessionsCollection(safePluginOptions)

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

      // Add additional admin config here

      // if (!config.admin.components.views) {
      //   config.admin.components.views = {}
      // }

      // config.admin.components.views.analyticsDashboard = {
      //   Component: `payload-plugin-analytics/rsc#AnalyticsDashboard`,
      //   path: '/analytics',
      // }

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

    config.collections = [...(config.collections || []), eventsCollection, sessionsCollection]

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
