// Lightweight local functions server
// Replaces 'netlify dev' when it crashes on edge functions setup.
// Serves Netlify-style functions on port 9999, proxied by Vite.
//
// Usage: node server.js
// Requires: .env file with ANTHROPIC_API_KEY (and optionally SUPABASE_* vars)

import { createServer } from 'http'
import { readdir, readFile } from 'fs/promises'
import { resolve, basename } from 'path'
import { pathToFileURL } from 'url'

// Load .env file
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
  console.warn('No .env file found — using existing environment variables')
}

const PORT = 9999
const FUNCTIONS_DIR = resolve(process.cwd(), 'netlify/functions')

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

async function main() {
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

    // Route: /.netlify/functions/<name>
    const match = req.url.match(/^\/.netlify\/functions\/([a-zA-Z0-9_-]+)/)
    if (!match) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
      return
    }

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
      const headers = { 'Content-Type': 'application/json', ...(result.headers || {}) }
      res.writeHead(result.statusCode || 200, headers)
      res.end(result.body || '')
    } catch (err) {
      console.error(`[${fnName}] Error:`, err.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal function error' }))
    }
  })

  server.timeout = 120000 // 2 minute timeout

  server.listen(PORT, () => {
    console.log(`Functions server running on http://localhost:${PORT}`)
    console.log(`Proxy from Vite: /.netlify/functions/* → http://localhost:${PORT}`)
  })
}

main().catch(console.error)
