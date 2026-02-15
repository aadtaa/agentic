// Code Agent V2 — Streaming Single-Call Pipeline
//
// ONE Sonnet call produces plan + code + chart + insight.
// The plan streams to the frontend in real-time via SSE while
// the code/chart JSON is still generating.
//
// Output format:  <plan>coach text</plan> then JSON blob
// SSE events:     plan_delta → plan_done → result

import Anthropic from '@anthropic-ai/sdk'

const SONNET_MODEL = 'claude-sonnet-4-5-20250929'

// ─────────────────────────────────────────────
// SYSTEM PROMPT — plan text first, then JSON
// ─────────────────────────────────────────────

const SYSTEM = `You are an elite cycling coach AND JavaScript developer.  You receive an athlete's question plus a data summary of their activity file (FIT/TCX/GPX parsed client-side).

## OUTPUT FORMAT

Your response MUST follow this exact structure — plan text inside <plan> tags, then a JSON object:

<plan>
Write 3-6 conversational sentences TO the athlete as if you're sitting next to them at a cafe reviewing their ride. Flow naturally — no bullet points, no bold markers. Mention specific fields and metrics by name, weave them into the narrative. Example tone: "I'll start by plotting your power with a 30-second rolling average so we can see past the spikes to your real effort trend. Since a coach never looks at power alone, I'm layering in your heart rate to check for cardiac drift..."
</plan>
{
  "extraction_code": "JavaScript function body. Receives \`data\` (array of point objects). Returns an array of flat objects for Recharts.",
  "metrics_code": "JavaScript function body. Receives \`data\`. Returns [{label, value, unit}].",
  "chart_config": {
    "type": "composed|line|bar|area|scatter",
    "title": "Chart Title",
    "xKey": "time_label",
    "xLabel": "Time",
    "yLabel": "Left Y label",
    "yLabelRight": "Right Y label (if dual-axis)",
    "series": [{"key":"field","label":"Name","color":"#hex","type":"line","strokeWidth":2,"dot":false,"fillOpacity":0.15,"yAxisId":"left|right"}],
    "tooltip": true, "legend": true, "grid": true, "brush": true,
    "referenceLines": [{"y":250,"label":"FTP","color":"#ff0000","yAxisId":"left","strokeDasharray":"5 5"}]
  },
  "insight": "2-4 sentences interpreting the analysis. Reference metrics, provide coaching context."
}

IMPORTANT: The <plan> block comes FIRST. The JSON follows AFTER </plan> with NO markdown fences.

## STANDARD COLORS
Power=#2F71FF, HR=#FF3B2F, Cadence=#FF9500, Speed=#28CD56, Altitude=#8E8E93, Temp=#AF52DE, Gradient=#FF2D55

## CODE REQUIREMENTS
- Both code strings run via \`new Function('data', code)\` — no imports, no DOM, pure JS
- MUST use ES5 syntax: var, function, string concatenation — NO const/let/arrow/template literals/destructuring
- Compute rolling averages on FULL dataset, THEN resample to ~500 points
- Guard nulls: (point.power || 0), (point.heart_rate || 0)
- Always add time_label: format elapsed_seconds as "mm:ss" or "h:mm:ss"

## DUAL Y-AXIS RULES
- Power/Watts → yAxisId: "left"
- HR/BPM → yAxisId: "right"
- Each series MUST specify yAxisId

## CYCLING METRIC FORMULAS
- NP (Normalized Power): 30s rolling avg → 4th power each → mean → 4th root
- IF (Intensity Factor): NP / FTP. Estimate FTP as 75% of peak 20min power, or 72% of max power
- TSS: (duration_s × NP × IF) / (FTP × 3600) × 100
- VI (Variability Index): NP / avg_power
- Power Zones (Coggan 7-zone): Z1<55%, Z2 55-75%, Z3 75-90%, Z4 90-105%, Z5 105-120%, Z6 120-150%, Z7>150% of FTP
- HR Zones (5-zone): Z1<60%, Z2 60-70%, Z3 70-80%, Z4 80-90%, Z5 90-100% of max HR

## FIELD KNOWLEDGE
- power: Watts (0-2000W, >400=sprint, 150-250=endurance)
- heart_rate: BPM (resting 40-60, endurance 120-150, threshold 160-180)
- cadence: RPM (60-120 typical, 80-95 optimal)
- speed: m/s (×3.6 for km/h)
- altitude: meters
- distance_meters: cumulative
- elapsed_seconds: from start
- temperature: Celsius

## ACTIVE THINKING — go beyond the literal question
- "Show me power" → add HR for drift detection, compute NP/IF/TSS/VI
- "Heart rate zones" → add power context, zone time distribution
- "How was my ride?" → full performance assessment with key metrics
- Always add companion data: a coach never shows one metric in isolation`

// ─────────────────────────────────────────────
// CONVERSATIONAL (no file — stays non-streaming)
// ─────────────────────────────────────────────

const CHAT_SYSTEM = `You are Lucy's Code Assistant V2 — you help athletes analyze cycling activity files (FIT, TCX, GPX).

When no file is uploaded, you can:
- Explain what analyses you can do
- Help understand file formats
- Answer questions about cycling metrics (power, HR zones, TSS, NP, etc.)
- Guide them to upload a file

Be concise and helpful. Do NOT use emojis.`

// ─────────────────────────────────────────────
// Build ride context
// ─────────────────────────────────────────────

function buildRideContext(dataSummary) {
  const tags = []
  if (!dataSummary.fields?.latitude && !dataSummary.fields?.longitude) tags.push('INDOOR (no GPS)')
  if (dataSummary.fields?.altitude) {
    const range = dataSummary.fields.altitude.max - dataSummary.fields.altitude.min
    if (range < 20) tags.push('FLAT (<20m)')
    else if (range > 500) tags.push('MOUNTAINOUS (>500m)')
    else tags.push(`ROLLING (~${Math.round(range)}m)`)
  }
  if (!dataSummary.fields?.power) tags.push('NO POWER METER')
  if (!dataSummary.fields?.heart_rate) tags.push('NO HR MONITOR')
  if (!dataSummary.fields?.cadence) tags.push('NO CADENCE SENSOR')
  if (dataSummary.fields?.temperature) tags.push('HAS TEMPERATURE')

  const fieldRanges = Object.entries(dataSummary.fields || {})
    .filter(([k]) => !['latitude', 'longitude'].includes(k))
    .map(([k, v]) => `${k}: min=${v.min} max=${v.max} avg=${v.avg}`)
    .join('\n')

  const fieldsAvailable = Object.keys(dataSummary.fields || {})
    .filter(f => f !== 'latitude' && f !== 'longitude')

  return { tags, fieldRanges, fieldsAvailable }
}

// ─────────────────────────────────────────────
// JSON PARSER (tolerant)
// ─────────────────────────────────────────────

function parseJSON(text) {
  try {
    return JSON.parse(text)
  } catch (e) {
    const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (codeBlock) {
      try { return JSON.parse(codeBlock[1]) } catch (_) { /* fall through */ }
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) } catch (_) { /* fall through */ }
    }
    return null
  }
}

// ─────────────────────────────────────────────
// STREAMING ANALYSIS — async generator yields SSE events
// ─────────────────────────────────────────────

async function* streamAnalysis(message, dataSummary, samplePoints, history, anthropic) {
  const startTime = Date.now()
  const { tags, fieldRanges, fieldsAvailable } = buildRideContext(dataSummary)

  const msgs = []
  if (history && history.length > 0) {
    for (const m of history.slice(-6)) {
      msgs.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      })
    }
  }

  msgs.push({
    role: 'user',
    content: `## ATHLETE'S QUESTION
${message}

## RIDE CHARACTERISTICS
${tags.length > 0 ? tags.join(', ') : 'Standard outdoor ride'}
Points: ${dataSummary.point_count}, Duration: ${Math.round(dataSummary.duration_seconds / 60)}min, Distance: ${dataSummary.distance_km}km, Sample rate: ~${dataSummary.sample_rate}s

## AVAILABLE DATA FIELDS
${fieldsAvailable.join(', ')}

## FIELD RANGES
${fieldRanges}

## SAMPLE POINTS (structure reference — first 5)
${JSON.stringify((samplePoints || []).slice(0, 5), null, 2)}

Respond with <plan>...</plan> then the JSON object.`
  })

  // Stream from Anthropic
  const stream = anthropic.messages.stream({
    model: SONNET_MODEL,
    max_tokens: 16384,
    temperature: 0.5,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: msgs
  })

  let fullText = ''
  let planEmitted = ''   // how much plan text we've already sent
  let planDone = false

  const PLAN_OPEN = '<plan>'
  const PLAN_CLOSE = '</plan>'
  // Keep a lookback buffer so we don't split on the closing tag
  const LOOKBACK = PLAN_CLOSE.length

  for await (const event of stream) {
    if (event.type !== 'content_block_delta') continue
    if (event.delta?.type !== 'text_delta') continue

    fullText += event.delta.text

    if (planDone) continue // accumulating JSON, nothing to emit yet

    const openIdx = fullText.indexOf(PLAN_OPEN)
    if (openIdx === -1) continue // haven't seen <plan> yet

    const closeIdx = fullText.indexOf(PLAN_CLOSE)

    if (closeIdx !== -1) {
      // Plan tag fully closed — emit any remaining plan text
      const planText = fullText.slice(openIdx + PLAN_OPEN.length, closeIdx)
      const newText = planText.slice(planEmitted.length)
      if (newText) {
        yield { type: 'plan_delta', text: newText }
      }
      planDone = true
      yield { type: 'plan_done' }
    } else {
      // Plan started but not closed — stream safe portion
      // (hold back last N chars in case </plan> is split across chunks)
      const planSoFar = fullText.slice(openIdx + PLAN_OPEN.length)
      const safeEnd = Math.max(0, planSoFar.length - LOOKBACK)
      const safeText = planSoFar.slice(0, safeEnd)
      const newText = safeText.slice(planEmitted.length)
      if (newText) {
        yield { type: 'plan_delta', text: newText }
        planEmitted = safeText
      }
    }
  }

  // Stream finished — get final message for usage stats
  const finalMessage = await stream.finalMessage()
  const usage = finalMessage.usage || {}
  const elapsed = Date.now() - startTime

  console.log(`[code-agent-v2] Sonnet streamed: ${elapsed}ms, in=${usage.input_tokens} out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens || 0}`)

  // Extract JSON from after </plan>
  const closeIdx = fullText.indexOf(PLAN_CLOSE)
  const jsonText = closeIdx !== -1
    ? fullText.slice(closeIdx + PLAN_CLOSE.length).trim()
    : fullText // fallback: try parsing the whole thing

  const result = parseJSON(jsonText)

  if (!result || !result.extraction_code) {
    yield {
      type: 'error',
      message: 'Failed to generate analysis code. Please try rephrasing your request.'
    }
    return
  }

  yield {
    type: 'result',
    data: {
      extraction_code: result.extraction_code,
      metrics_code: result.metrics_code || 'return []',
      chart_config: result.chart_config,
      insight: result.insight || '',
      timing: {
        sonnet_ms: elapsed,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_read: usage.cache_read_input_tokens || 0,
        cache_creation: usage.cache_creation_input_tokens || 0
      }
    }
  }
}

// ─────────────────────────────────────────────
// NETLIFY HANDLER
// ─────────────────────────────────────────────

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body)
    const { message, dataSummary, samplePoints, history = [], mode } = body

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }
    }

    const anthropic = new Anthropic({ apiKey })

    // ─── CHAT (no file data) — regular JSON response ───
    if (!dataSummary || mode === 'chat') {
      const msgs = []
      if (history && history.length > 0) {
        for (const m of history.slice(-10)) {
          msgs.push({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
          })
        }
      }
      msgs.push({ role: 'user', content: message })

      const response = await anthropic.messages.create({
        model: SONNET_MODEL,
        max_tokens: 1024,
        system: CHAT_SYSTEM,
        messages: msgs
      })

      const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', response: text, timestamp: new Date().toISOString() })
      }
    }

    // ─── ANALYSIS — stream SSE ──────────────────────
    return {
      stream: streamAnalysis(message, dataSummary, samplePoints || [], history, anthropic)
    }

  } catch (error) {
    console.error('[code-agent-v2] Error:', error)

    if (error.status === 401) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Invalid API key' }) }
    }
    if (error.status === 429) {
      return { statusCode: 429, body: JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }) }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred processing your request.' })
    }
  }
}
