import esbuild from 'esbuild'
import fs from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Build function
export async function buildScript() {
  try {
    // Ensure the public directory exists in the plugin root
    const publicDir = resolve(__dirname, '../public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    await esbuild.build({
      bundle: true,
      entryPoints: [resolve(__dirname, './analytics-client.ts')],
      format: 'iife',
      minify: true,
      outfile: resolve(publicDir, 'analytics.min.js'),
      platform: 'browser',
      sourcemap: true,
      target: ['es6'],
    })

    console.log('Analytics script built successfully!')
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

void buildScript()
