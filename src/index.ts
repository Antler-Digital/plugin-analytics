import type { CollectionSlug, Config } from 'payload'

export type DefaultTemplateTestConfig = {
  /**
   * List of collections to add a custom field
   */
  collections?: Partial<Record<CollectionSlug, true>>
  disabled?: boolean
}

export const defaultTemplateTest =
  (pluginOptions: DefaultTemplateTestConfig) =>
  (config: Config): Config => {
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

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }
    }

    return config
  }
