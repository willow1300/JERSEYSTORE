// Local stand-in for the Netlify functions runtime.
//
// Serves the two IntaSend handlers (create-checkout, intasend-webhook) over a
// plain Node HTTP server so the full payment flow can be tested before
// deploying. The Vite dev server proxies /.netlify/functions/* to this process
// (see vite.config.ts), so the frontend calls work exactly as they do on
// Netlify — the browser never talks to this port directly.
//
// Usage: npm run payments:dev   (loads secrets from .env.local)

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PAYMENTS_DEV_PORT || 8899)

// Minimal .env.local loader — keeps the dev harness dependency-free.
// Values already present in the ambient environment always win.
function loadEnv(file) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let value = m[2]
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = value
    }
  } catch {
    // No .env.local — fall back to the ambient environment only.
  }
}

loadEnv(path.join(ROOT, '.env.local'))

// Import the handlers AFTER the env is loaded — both modules read process.env
// at import time, exactly like the Netlify runtime injects env before boot.
const createCheckout = (
  await import(pathToFileURL(path.join(ROOT, 'netlify/functions/create-checkout/create-checkout.mjs')).href)
).default
const intasendWebhook = (
  await import(pathToFileURL(path.join(ROOT, 'netlify/functions/intasend-webhook/intasend-webhook.mjs')).href)
).default

const ROUTES = {
  '/.netlify/functions/create-checkout': createCheckout,
  '/.netlify/functions/intasend-webhook': intasendWebhook,
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const handler = ROUTES[url.pathname]

  console.log(`[payments:dev] ${req.method} ${url.pathname}`)

  if (!handler) {
    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ ok: true, routes: Object.keys(ROUTES) }))
    }
    res.writeHead(404, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Not found' }))
  }

  const rawBody = (await readBody(req)).toString('utf8')

  // Netlify event shape: Node already lowercases header names, and the raw
  // body arrives unencoded, matching the production runtime.
  const event = {
    httpMethod: req.method,
    headers: req.headers,
    body: rawBody,
    isBase64Encoded: false,
  }

  try {
    const result = await handler(event)
    res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' })
    res.end(result.body || '')
  } catch (e) {
    console.error('[payments:dev] handler threw', e)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal error' }))
  }
})

server.listen(PORT, () => {
  console.log(
    `[payments:dev] functions listening on http://localhost:${PORT} ` +
      `(INTASEND_MODE=${process.env.INTASEND_MODE || 'sandbox'})`,
  )
})
