import type { NextServerOptions } from 'next/dist/server/next.js'

import { createServer } from 'http'
import next from 'next'
import open from 'open'
import path from 'path'
import { fileURLToPath, parse } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const port = process.env.PORT || 3000

const opts: NextServerOptions = {
  dev: true,
  dir: dirname,
}

// @ts-expect-error next types do not import
const app = next(opts)
const handle = app.getRequestHandler()

await app.prepare()

await open(`http://localhost:${port}/admin`)

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true)
  void handle(req, res, parsedUrl)
})

server.listen(port)
