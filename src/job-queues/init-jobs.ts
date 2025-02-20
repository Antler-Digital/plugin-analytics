import type { Config, JobsConfig, Payload, PayloadRequest } from 'payload'

import fs from 'fs'
import path from 'path'

import type { AnalyticsPluginOptions, VercelJson } from '../types.js'

import { initDeleteHistoryTask } from './delete-history-task.js'

export const initConfigJobs = (config: Config, pluginOptions: Required<AnalyticsPluginOptions>) => {
  config.jobs = {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) {
          return true
        }

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    autoRun: [],
    tasks: [],
    workflows: [],
    ...config.jobs,
  } satisfies Config['jobs']

  config.jobs.tasks.push(initDeleteHistoryTask(pluginOptions))

  if (!pluginOptions.isServerless) {
    config.jobs.autoRun = async (payload) => {
      const autoRun = config.jobs?.autoRun
      const cronConfig: JobsConfig['autoRun'] = []

      if (autoRun) {
        if (Array.isArray(autoRun)) {
          cronConfig.concat(autoRun)
        } else {
          const crons = await autoRun(payload)
          cronConfig.concat(crons)
        }
      }

      if (!cronConfig.some(({ queue }) => queue === 'nightly')) {
        cronConfig.push({
          cron: '0 * * * *',
          queue: 'nightly',
        })
      }

      return cronConfig
    }
  }
}

export const onInitCrons = async (
  pluginOptions: AnalyticsPluginOptions,
  payload: Payload,
): Promise<void> => {
  try {
    const { collectionSlug, isServerless } = pluginOptions

    if (!isServerless) {
      return
    }

    const vercelJson = path.resolve(process.cwd(), 'vercel.json')

    let fileContent: VercelJson = {
      crons: [],
    }

    if (fs.existsSync(vercelJson)) {
      const content = JSON.parse(fs.readFileSync(vercelJson, 'utf-8'))
      fileContent = {
        ...content,
      }
    }

    const payloadNightlyCronPath = '/api/payload-jobs/run?queue=nightly'

    if (fileContent.crons.some(({ path }) => path === payloadNightlyCronPath)) {
      return
    }

    fileContent.crons.push({
      path: payloadNightlyCronPath,
      schedule: '0 * * * *',
    })

    fs.writeFileSync(vercelJson, JSON.stringify(fileContent))

    await payload.jobs.queue({
      input: {},
      queue: 'nightly',
      task: `${collectionSlug}_delete_history`,
    })
  } catch (err: unknown) {
    payload.logger.error({
      err,
      msg: 'Error creating Cron Jobs',
    })
  }
}
