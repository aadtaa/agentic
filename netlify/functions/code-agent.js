// Lucy Code Agent — Activity File Analysis Pipeline
// Single-call LLM: plans the visualization + generates code in one shot.
//
// File parsing happens CLIENT-SIDE (binary FIT files can't be sent as JSON).
// The client sends a data summary + sample points. The LLM generates code
// that runs in a client-side sandbox against the full parsed data.

import Anthropic from '@anthropic-ai/sdk'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

// ─────────────────────────────────────────────
// SYSTEM PROMPT (single unified call)
// ─────────────────────────────────────────────

const AGENT_SYSTEM = `You are an elite cycling data analyst who writes JavaScript code for Recharts visualizations. You receive a user question + activity file data and produce analysis code in ONE step.

## THINKING PROCESS (internal — inform your code, keep output brief)

1. INTENT: What does the user actually need? "Show me power" → smoothed power + HR overlay for decoupling context.
2. COMPANION DATA: What else would a coach show? Power→add HR. Elevation→add speed/power. HR→add power for drift detection.
3. CHART TYPE: Use "composed" for 2+ series with different scales. Never show raw power alone — always smooth (30s rolling avg).
4. COLORS: Power=#2F71FF, HR=#FF3B2F, Cadence=#FF9500, Speed=#28CD56, Altitude=#8E8E93, Temp=#AF52DE.

## CYCLING DOMAIN (apply correct definitions)
- **NP**: 30s rolling avg → 4th power each → average → 4th root
- **IF**: NP / FTP (estimate FTP as 75% of max power if unknown)
- **TSS**: (seconds × NP × IF) / (FTP × 3600) × 100
- **VI**: NP / Avg Power (>1.05 = variable)
- **Decoupling**: Compare power:HR ratio first half vs second half (>5% = fatigue)
- **Gradient**: rise/run smoothed over 50-100m minimum
- **HR Zones** (5-zone): Z1<60%, Z2 60-70%, Z3 70-80%, Z4 80-90%, Z5 90-100% of max HR
- **Power Zones** (Coggan 7-zone): Z1<55%, Z2 55-75%, Z3 75-90%, Z4 90-105%, Z5 105-120%, Z6 120-150%, Z7>150% of FTP
- Rolling avg windows: power=30s, HR=5-10s, speed=10-20s

## CODE REQUIREMENTS
- extraction_code: function body receiving \`data\` (array of points), returns flat objects for Recharts
- metrics_code: function body receiving \`data\`, returns [{label, value, unit}]
- Runs in sandbox via \`new Function('data', code)\` — no imports, no DOM, pure JS
- Use \`var\`/\`function\` (ES5) — no const/let/arrow/template literals/destructuring
- Compute rolling averages on FULL data, THEN resample (limit ~500 points for display)
- Guard nulls: \`(point.power || 0)\`
- Add time_label field: "mm:ss" or "h:mm:ss" from elapsed_seconds
- Brush enabled for >1000 points or >30min rides

## OUTPUT FORMAT (JSON only, no markdown, no wrapping)
{
  "plan": {
    "reasoning": "1-2 sentences: what does the user need and why this chart design",
    "intent_decoded": "brief: what the user actually needs",
    "chart_type": "line|bar|area|scatter|composed",
    "title": "Chart title",
    "companion_series": ["field names added for context"],
    "design_notes": "brief layout/formatting notes"
  },
  "extraction_code": "JS function body string",
  "chart_config": {
    "type": "line|bar|area|scatter|composed",
    "title": "Chart Title",
    "xKey": "field name",
    "xLabel": "X Axis Label",
    "yLabel": "Y Axis Label",
    "yLabelRight": "optional right Y label",
    "series": [{"key":"field","label":"Name","color":"#hex","type":"line","strokeWidth":2,"dot":false,"fillOpacity":0.3,"yAxisId":"left|right"}],
    "tooltip": true, "legend": true, "grid": true, "brush": true,
    "referenceLines": [{"y":250,"label":"FTP","color":"#ff0000","strokeDasharray":"5 5"}]
  },
  "metrics_code": "JS function body string returning [{label, value, unit}]"
}`

const SYNTHESIZER_SYSTEM = `You are Lucy's Code Assistant — you help athletes understand their cycling activity data through visualizations and analysis.

You receive the results of a code execution pipeline that processed their activity file. Your job is to provide a brief, insightful interpretation of the results.

## RULES
1. Be concise — 2-4 sentences interpreting the visualization/metrics
2. Reference specific numbers from the metrics
3. Provide coaching context (what the numbers mean for training)
4. Suggest follow-up analyses if relevant
5. Do NOT describe the chart in detail — the user can see it
6. Do NOT use emojis
7. Use markdown for formatting
8. If metrics show interesting patterns (high variability, zone distribution skew, etc.), call them out`

// ─────────────────────────────────────────────
// MAIN PIPELINE (single LLM call)
// ─────────────────────────────────────────────

async function runCodeAgent(instruction, dataSummary, samplePoints, anthropic, history) {
  const startTime = Date.now()
  const stages = {}

  // Build messages
  const messages = []

  // Include history for multi-turn context
  if (history && history.length > 0) {
    for (const msg of history.slice(-6)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      })
    }
  }

  // Detect ride characteristics
  const rideContext = []
  if (!dataSummary.fields?.latitude && !dataSummary.fields?.longitude) {
    rideContext.push('INDOOR (no GPS)')
  }
  if (dataSummary.fields?.altitude) {
    const altRange = dataSummary.fields.altitude.max - dataSummary.fields.altitude.min
    if (altRange < 20) rideContext.push('FLAT (<20m elevation)')
    else if (altRange > 500) rideContext.push('MOUNTAINOUS (>500m elevation)')
  }
  if (!dataSummary.fields?.power) rideContext.push('NO POWER METER')
  if (!dataSummary.fields?.heart_rate) rideContext.push('NO HR MONITOR')

  const fieldRanges = Object.entries(dataSummary.fields || {})
    .filter(([k]) => !['latitude', 'longitude'].includes(k))
    .map(([k, v]) => `${k}: min=${v.min} max=${v.max} avg=${v.avg}`)
    .join('\n')

  const fieldsAvailable = Object.keys(dataSummary.fields || {})
    .filter(f => f !== 'latitude' && f !== 'longitude')

  messages.push({
    role: 'user',
    content: `## INSTRUCTION
${instruction}

## RIDE
${rideContext.length > 0 ? rideContext.join(', ') : 'Standard outdoor ride'}
Points: ${dataSummary.point_count}, Duration: ${Math.round(dataSummary.duration_seconds / 60)}min, Distance: ${dataSummary.distance_km}km, Sample rate: ~${dataSummary.sample_rate}s
Fields: ${fieldsAvailable.join(', ')}

## FIELD RANGES
${fieldRanges}

## SAMPLE POINTS (structure reference)
${JSON.stringify(samplePoints.slice(0, 5), null, 2)}`
  })

  let result
  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 8192,
      system: [{ type: 'text', text: AGENT_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages
    })

    const usage = response.usage || {}
    const elapsed = Date.now() - startTime

    stages.planner = {
      ms: elapsed,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read: usage.cache_read_input_tokens || 0,
      cache_creation: usage.cache_creation_input_tokens || 0
    }

    console.log(`[code-agent] LLM call: ${elapsed}ms, in=${usage.input_tokens} out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens || 0}`)

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    result = parseJSON(text)
    if (!result || !result.extraction_code) {
      throw new Error('LLM returned invalid output')
    }

    // Populate planner stage info from plan sub-object for frontend display
    const plan = result.plan || {}
    stages.planner.reasoning = plan.reasoning
    stages.planner.intent_decoded = plan.intent_decoded
    stages.planner.chart_type = plan.chart_type || result.chart_config?.type
    stages.planner.title = plan.title || result.chart_config?.title
    stages.planner.companion_series = plan.companion_series
    stages.planner.design_notes = plan.design_notes

  } catch (err) {
    console.error('[code-agent] LLM error:', err.message)
    return {
      error: 'Failed to generate analysis code. Please try rephrasing your request.',
      stages,
      timing: { total_ms: Date.now() - startTime }
    }
  }

  return {
    extraction_code: result.extraction_code,
    metrics_code: result.metrics_code || 'return []',
    chart_config: result.chart_config,
    plan: result.plan || {},
    stages,
    timing: {
      total_ms: Date.now() - startTime
    }
  }
}

// ─────────────────────────────────────────────
// SYNTHESIZE — brief interpretation of results
// ─────────────────────────────────────────────

async function synthesizeInsight(instruction, metrics, plan, anthropic) {
  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 500,
      system: [{ type: 'text', text: SYNTHESIZER_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `## USER ASKED
${instruction}

## CHART
${plan.title || 'Chart'} (${plan.chart_type || 'composed'} chart)${plan.design_notes ? ' — ' + plan.design_notes : ''}

## COMPUTED METRICS
${JSON.stringify(metrics, null, 2)}`
      }]
    })

    return response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
  } catch (err) {
    console.error('[code-agent] Synthesizer error:', err.message)
    return null
  }
}

// ─────────────────────────────────────────────
// CONVERSATIONAL — handles messages without file data
// ─────────────────────────────────────────────

async function handleConversation(message, history, anthropic) {
  const messages = []

  if (history && history.length > 0) {
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      })
    }
  }

  messages.push({ role: 'user', content: message })

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    system: `You are Lucy's Code Assistant — you help athletes analyze their cycling activity files (FIT, TCX, GPX).

When no file is uploaded, you can:
- Explain what analyses you can do
- Help the user understand what data is in different file formats
- Answer questions about cycling metrics (power, HR zones, TSS, NP, etc.)
- Guide them to upload a file for visualization

Be concise and helpful. Do NOT use emojis.`,
    messages
  })

  return response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
}

// ─────────────────────────────────────────────
// JSON PARSER
// ─────────────────────────────────────────────

function parseJSON(text) {
  try {
    return JSON.parse(text)
  } catch (e) {
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (codeBlockMatch) {
      try { return JSON.parse(codeBlockMatch[1]) } catch (e2) { /* fall through */ }
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) } catch (e3) { /* fall through */ }
    }
    return null
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
    const { message, dataSummary, samplePoints, history = [], mode = 'analyze' } = body

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }
    }

    const anthropic = new Anthropic({ apiKey })

    // If no file data, handle as conversation
    if (!dataSummary || mode === 'chat') {
      const response = await handleConversation(message, history, anthropic)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          response,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Full pipeline: Plan → Generate
    const result = await runCodeAgent(message, dataSummary, samplePoints || [], anthropic, history)

    if (result.error) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          response: result.error,
          pipeline: result.stages,
          timing: result.timing,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Synthesize a brief insight about the results
    // (client will call this after executing the code and getting metrics)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'visualization',
        extraction_code: result.extraction_code,
        metrics_code: result.metrics_code,
        chart_config: result.chart_config,
        plan: {
          reasoning: result.plan.reasoning,
          intent_decoded: result.plan.intent_decoded,
          chart_type: result.plan.chart_type,
          title: result.plan.title,
          extraction_goal: result.plan.extraction_goal,
          companion_series: result.plan.companion_series,
          design_notes: result.plan.design_notes
        },
        pipeline: result.stages,
        timing: result.timing,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('[code-agent] Error:', error)

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

// ─────────────────────────────────────────────
// SYNTHESIS ENDPOINT (called after client-side execution)
// ─────────────────────────────────────────────

export async function synthesize(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { instruction, metrics, plan } = JSON.parse(event.body)
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }
    }

    const anthropic = new Anthropic({ apiKey })
    const insight = await synthesizeInsight(instruction, metrics, plan, anthropic)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insight })
    }
  } catch (error) {
    console.error('[code-agent] Synthesize error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Synthesis failed' }) }
  }
}
