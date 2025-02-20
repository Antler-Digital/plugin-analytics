import type { CollectionSlug, Config } from 'payload'

import type { AnalyticsPluginOptions } from './types.js'

import { initEventsCollection } from './collections/events.js'
import { initSessionsCollection } from './collections/sessions.js'
import { EventsEndpoint } from './endpoints/events-endpoint.js'
import { initConfigJobs } from './job-queues/init-jobs.js'
import { onInitExtension } from './utils/onInitExtension.js'

export type AnalyticsPluginConfig = {
  /**
   * List of collections to add a custom field
   */
  collections?: Partial<Record<CollectionSlug, true>>
  disabled?: boolean
}

export const analyticsPlugin =
  (pluginOptions: AnalyticsPluginConfig) =>
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

    if (!config.collections) {
      config.collections = []
    }

    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    if (!config.admin.components.views) {
      config.admin.components.views = {}
    }

    config.admin.components.views.analyticsDashboard = {
      Component: `payload-plugin-analytics/rsc#AnalyticsDashboard`,
      path: '/analytics',
    }

    if (!config.admin.components.afterNavLinks) {
      config.admin.components.afterNavLinks = []
    }

    config.admin.components.afterNavLinks.push({
      exportName: 'AnalyticsLink',
      path: 'payload-plugin-analytics/rsc#AnalyticsLink',
      serverProps: {
        href: '/admin/analytics',
        label: 'Analytics',
      },
    })

    initConfigJobs(config, safePluginOptions)

    config.collections = [...(config.collections || []), eventsCollection, sessionsCollection]

    config.onInit = async (payload) => {
      if (incomingConfig.onInit) {
        await incomingConfig.onInit(payload)
      }
      // Add additional onInit code by using the onInitExtension function
      onInitExtension(safePluginOptions, payload)
      // await onInitCrons(safePluginOptions, payload);
    }

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }
    }

    return config
  }
