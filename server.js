// Unified server for local development AND production (Railway, etc.)
//
// LOCAL DEV:  node server.js          → functions on port 9999, Vite proxies to it
// PRODUCTION: npm run build && node server.js → serves dist/ + functions on PORT
//
// Requires: .env file (local) or environment variables (Railway)

import { createServer } from 'http'
import { readdir, readFile, stat } from 'fs/promises'
import { resolve, basename, extname, join } from 'path'
import { pathToFileURL } from 'url'

// Load .env file (silently skip in production where env vars are set directly)
try {
  const envFile = await readFile(resolve(process.cwd(), '.env'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
  console.log('Loaded .env file')
} catch (e) {
  console.log('No .env file — using environment variables')
}

// Railway sets PORT; local dev defaults to 9999
const PORT = parseInt(process.env.PORT || '9999', 10)
const FUNCTIONS_DIR = resolve(process.cwd(), 'netlify/functions')
const DIST_DIR = resolve(process.cwd(), 'dist')

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.map':  'application/json',
  '.webp': 'image/webp',
}

// Check if dist/ exists (production mode)
let isProduction = false
try {
  const distStat = await stat(DIST_DIR)
  isProduction = distStat.isDirectory()
} catch (e) {
  // dist/ doesn't exist — local dev mode
}

// Load all function handlers
async function loadFunctions() {
  const fns = {}
  const files = await readdir(FUNCTIONS_DIR)

  for (const file of files) {
    if (!file.endsWith('.js')) continue
    const name = basename(file, '.js')
    const url = pathToFileURL(resolve(FUNCTIONS_DIR, file)).href
    try {
      const mod = await import(url)
      if (mod.handler) {
        fns[name] = mod.handler
        console.log(`  Loaded function: ${name}`)
      }
    } catch (err) {
      console.warn(`  Failed to load ${name}: ${err.message}`)
    }
  }
  return fns
}

// Try to serve a static file from dist/
async function serveStatic(req, res) {
  // Strip query string
  const urlPath = req.url.split('?')[0]

  // Map URL to file path
  let filePath = join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath)

  try {
    const fileStat = await stat(filePath)

    // If it's a directory, try index.html inside it
    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html')
      await stat(filePath) // will throw if not found
    }

    const ext = extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    const content = await readFile(filePath)

    // Cache static assets (js/css with hashes) aggressively
    const cacheControl = ext === '.html'
      ? 'no-cache'
      : 'public, max-age=31536000, immutable'

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    })
    res.end(content)
    return true
  } catch (e) {
    return false // File not found
  }
}

async function main() {
  console.log(`Mode: ${isProduction ? 'PRODUCTION (serving dist/)' : 'LOCAL DEV (functions only)'}`)
  console.log('Loading functions...')
  const functions = await loadFunctions()
  console.log(`\n${Object.keys(functions).length} functions loaded\n`)

  const server = createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    // Health check for Railway
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok' }))
      return
    }

    // Route: /.netlify/functions/<name>  →  API handler
    const match = req.url.match(/^\/.netlify\/functions\/([a-zA-Z0-9_-]+)/)
    if (match) {
      const fnName = match[1]
      const handler = functions[fnName]
      if (!handler) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: `Function "${fnName}" not found` }))
        return
      }

      // Read body
      let body = ''
      for await (const chunk of req) body += chunk

      // Build Netlify-style event
      const event = {
        httpMethod: req.method,
        headers: req.headers,
        body: body || null,
        queryStringParameters: Object.fromEntries(new URL(req.url, `http://localhost:${PORT}`).searchParams),
        isBase64Encoded: false
      }

      try {
        console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} /${fnName}`)
        const result = await handler(event)

        // Streaming support: if handler returns { stream: asyncIterable }, pipe SSE
        if (result.stream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          })
          try {
            for await (const chunk of result.stream) {
              res.write(`data: ${JSON.stringify(chunk)}\n\n`)
            }
          } catch (streamErr) {
            console.error(`[${fnName}] Stream error:`, streamErr.message)
            res.write(`data: ${JSON.stringify({ type: 'error', message: streamErr.message })}\n\n`)
          }
          res.write('data: [DONE]\n\n')
          res.end()
        } else {
          const headers = { 'Content-Type': 'application/json', ...(result.headers || {}) }
          res.writeHead(result.statusCode || 200, headers)
          res.end(result.body || '')
        }
      } catch (err) {
        console.error(`[${fnName}] Error:`, err.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal function error' }))
      }
      return
    }

    // Production: serve static files from dist/
    if (isProduction) {
      const served = await serveStatic(req, res)
      if (served) return

      // SPA fallback — serve index.html for all unmatched routes
      try {
        const indexHtml = await readFile(join(DIST_DIR, 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' })
        res.end(indexHtml)
      } catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not found')
      }
      return
    }

    // Local dev: no static serving (Vite handles it)
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  server.timeout = 120000 // 2 minute timeout

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`)
    if (isProduction) {
      console.log('Serving: static files from dist/ + API functions')
    } else {
      console.log(`Proxy from Vite: /.netlify/functions/* → http://localhost:${PORT}`)
    }
  })
}

main().catch(console.error)
