import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { AnalyticsPluginOptions } from '../types.js'

export const onInitExtension = (pluginOptions: AnalyticsPluginOptions, payload: Payload): void => {
  try {
    // Get the plugin's directory path
    const __dirname = path.dirname(fileURLToPath(import.meta.url))

    // Source file is in the plugin's public directory
    const sourceFile = path.resolve(__dirname, '../public/analytics.min.js')

    // Destination is the project's public directory
    const publicDir = path.resolve(process.cwd(), 'public')
    payload.logger.info({
      msg: 'Public directory:',
      publicDir,
    })
    const destFile = path.join(publicDir, 'analytics.min.js')

    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    if (!fs.existsSync(sourceFile)) {
      throw new Error(`Analytics script not found at ${sourceFile}. Did you run the build script?`)
    }

    // Copy analytics.min.js to public folder
    fs.copyFileSync(sourceFile, destFile)

    // if in dev mode in this project, dev/public must also exist.
    // We need the script to be in the dev/public directory so that
    // the pixel tracker on other localhosts, if in use, can find it.
    if (process.env.NODE_ENV === 'development') {
      const devPublicDir = path.resolve(process.cwd(), 'dev/public')
      if (!fs.existsSync(devPublicDir)) {
        fs.mkdirSync(devPublicDir, { recursive: true })
      }

      const devDestFile = path.join(devPublicDir, 'analytics.min.js')
      fs.copyFileSync(sourceFile, devDestFile)
    }

    // Also copy source map if it exists
    const sourceMapFile = `${sourceFile}.map`
    const destMapFile = `${destFile}.map`

    if (fs.existsSync(sourceMapFile)) {
      fs.copyFileSync(sourceMapFile, destMapFile)
    }

    payload.logger.info({
      destination: destFile,
      msg: 'Analytics script successfully copied to public directory',
      source: sourceFile,
    })
  } catch (err: unknown) {
    payload.logger.error({
      err,
      msg: 'Error copying analytics script to public directory',
    })
  }
}
