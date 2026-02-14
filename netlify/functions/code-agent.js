// Lucy Code Agent — Two-Phase Activity Analysis Pipeline
//
// Phase 1 (PLAN):  Opus actively thinks about what analysis the athlete needs.
//                  Returns a user-facing plan immediately so the frontend can
//                  display it while Phase 2 runs.
//
// Phase 2 (GENERATE): Opus receives the plan + data context and produces
//                     high-quality extraction/metrics code + chart config.
//
// File parsing happens CLIENT-SIDE (binary FIT files can't be sent as JSON).
// The client sends a data summary + sample points. The LLM generates code
// that runs in a client-side sandbox against the full parsed data.

import Anthropic from '@anthropic-ai/sdk'

const OPUS_MODEL  = 'claude-opus-4-6'
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

// ─────────────────────────────────────────────
// PHASE 1: ACTIVE-THINKER PLANNER
// ─────────────────────────────────────────────

const PLANNER_SYSTEM = `You are an elite cycling coach and performance analyst — Lucy's analytical brain. Your job is to ACTIVELY THINK about what analysis will give the athlete the deepest insight, going well beyond their literal question.

## ACTIVE THINKING FRAMEWORK

When you receive a question, think like a world-tour coach reviewing data with a rider:

### 1. DECODE THE REAL QUESTION
- "Show me power" → They want to understand power delivery, sustainability, and fatigue patterns
- "Heart rate zones" → They want to know training intensity distribution and whether the ride hit the right zones
- "How was my ride?" → They want a performance assessment relative to their capability
- "Normalized power" → They want to understand ride intensity, so also give IF, TSS, VI — the full picture
- "Cadence" → They want pedaling efficiency, so also show power-per-pedal-stroke and optimal range

### 2. ALWAYS ADD COMPANION DATA (a coach never shows one metric in isolation)
- Power → add HR (cardiac decoupling), Speed (efficiency), Cadence (technique)
- Heart Rate → add Power (aerobic drift detection), Zone time distribution
- Elevation → add Power (W/kg climbing proxy), Speed (descending technique), Gradient
- Cadence → add Power (torque vs spin), Speed (gear selection efficiency)
- Speed → add Power (aerodynamic efficiency), Elevation (terrain context)
- NP/IF/TSS → always show alongside avg power, VI, and the power curve that explains WHY

### 3. CHOOSE METRICS THAT TELL A STORY
Don't just compute averages. Think about what reveals performance:
- Efficiency: Variability Index, Efficiency Factor (NP/avg HR), Decoupling %
- Load: NP, IF, TSS — the training-load trinity
- Patterns: Zone time distribution, positive/negative power splits, fade analysis
- Peaks: Best 5s, 1min, 5min, 20min power (critical power profile)
- Context: Compare first-half vs second-half for fatigue detection

### 4. PICK THE RIGHT VISUALIZATION
- Time series with 2+ metrics → composed chart with dual Y-axes
- Distribution / zones → horizontal bar chart
- Correlation (power vs HR) → scatter plot
- Elevation profile with overlays → composed with area + lines
- Single metric over time → line with reference lines (thresholds)

## FIELD KNOWLEDGE
- power: Watts from power meter (0-2000W typical, >400W = sprint, 150-250W = endurance)
- heart_rate: BPM (resting 40-60, endurance 120-150, threshold 160-180, max 180-210)
- cadence: RPM (60-120 typical, 80-95 = self-selected optimal for most riders)
- speed: m/s (convert: multiply by 3.6 for km/h. 8-12 m/s = 30-43 km/h typical road)
- altitude: meters above sea level
- distance_meters: cumulative distance from start
- elapsed_seconds: seconds from ride start
- temperature: degrees Celsius

## CYCLING METRIC DEFINITIONS (use correct formulas)
- **NP** (Normalized Power): 30s rolling avg → raise each to 4th power → mean → 4th root
- **IF** (Intensity Factor): NP / FTP. Estimate FTP as 75% of peak 20min power, or 72% of max power if no long effort
- **TSS** (Training Stress Score): (duration_seconds × NP × IF) / (FTP × 3600) × 100
- **VI** (Variability Index): NP / avg_power. >1.05 = variable/surgy, <1.02 = very steady
- **EF** (Efficiency Factor): NP / avg_HR. Higher = more aerobically fit
- **Decoupling**: (first_half_power:HR ratio - second_half_power:HR ratio) / first_half_ratio × 100. >5% = aerobic fatigue
- **Power Zones** (Coggan 7-zone): Z1<55%, Z2 55-75%, Z3 75-90%, Z4 90-105%, Z5 105-120%, Z6 120-150%, Z7>150% of FTP
- **HR Zones** (5-zone): Z1<60%, Z2 60-70%, Z3 70-80%, Z4 80-90%, Z5 90-100% of max HR

## OUTPUT FORMAT (JSON only, no markdown fences)
{
  "user_facing_plan": "2-4 sentences written TO the athlete explaining what you're going to analyze, what companion data you're adding, and WHY it matters for their training. Be specific — mention the actual fields and metrics by name. Sound like a knowledgeable coach, not a chatbot.",
  "technical_plan": {
    "intent": "decoded user intent in one sentence",
    "chart_type": "composed|line|bar|area|scatter",
    "title": "Descriptive Chart Title",
    "primary_series": [{"field": "power", "transform": "30s_rolling_avg", "label": "Power (30s avg)"}],
    "companion_series": [{"field": "heart_rate", "reason": "cardiac decoupling detection", "label": "Heart Rate"}],
    "metrics": ["NP", "IF", "TSS", "VI", "Avg Power", "Max Power"],
    "computations": "Brief description of any special calculations (NP formula, zone boundaries, split analysis, etc.)",
    "design": "Layout notes: dual Y-axis (power left, HR right), 30s smoothing on power, time_label on X, brush enabled for >30min rides, reference line at estimated FTP"
  }
}`

// ─────────────────────────────────────────────
// PHASE 2: CODE GENERATOR
// ─────────────────────────────────────────────

const CODEGEN_SYSTEM = `You are an elite JavaScript developer generating Recharts visualization code for cycling data. You receive a detailed analysis plan created by a cycling coach and your job is to produce PERFECT code that implements it exactly.

## STANDARD COLORS (always use these)
Power=#2F71FF, HR=#FF3B2F, Cadence=#FF9500, Speed=#28CD56, Altitude=#8E8E93, Temp=#AF52DE, Gradient=#FF2D55

## CODE REQUIREMENTS
- extraction_code: function body receiving \`data\` (array of point objects), returns array of flat objects for Recharts
- metrics_code: function body receiving \`data\`, returns [{label, value, unit}]
- Both run in sandbox via \`new Function('data', code)\` — no imports, no DOM access, pure JS
- MUST use ES5 syntax: \`var\`, \`function\`, string concatenation — NO const/let/arrow/template literals/destructuring
- Compute rolling averages on the FULL dataset first, THEN resample down to ~500 points for display
- Always guard nulls: \`(point.power || 0)\`, \`(point.heart_rate || 0)\`
- Always add time_label field: format elapsed_seconds as "mm:ss" or "h:mm:ss"
- When computing NP: 30s rolling avg → 4th power each value → mean of 4th powers → 4th root of that mean
- When computing zones: count time-in-zone (seconds or %), not just point counts
- Brush enabled for rides >1000 points or >30min

## DUAL Y-AXIS RULES
When the plan calls for dual axes (e.g., power + HR):
- Power/Watts → yAxisId: "left", yLabel in Watts
- HR/BPM → yAxisId: "right", yLabelRight in bpm
- Each series MUST specify yAxisId: "left" or "right"

## CHART CONFIG SPEC
{
  "type": "composed|line|bar|area|scatter",
  "title": "Chart Title",
  "xKey": "time_label",
  "xLabel": "Time",
  "yLabel": "Left Y Label",
  "yLabelRight": "Right Y Label (if dual axis)",
  "series": [
    {
      "key": "field_name",
      "label": "Display Name",
      "color": "#hex",
      "type": "line|bar|area|scatter",
      "strokeWidth": 2,
      "dot": false,
      "fillOpacity": 0.15,
      "yAxisId": "left|right"
    }
  ],
  "tooltip": true,
  "legend": true,
  "grid": true,
  "brush": true,
  "referenceLines": [{"y": 250, "label": "FTP", "color": "#ff0000", "yAxisId": "left", "strokeDasharray": "5 5"}]
}

## OUTPUT FORMAT (JSON only, no markdown fences)
{
  "extraction_code": "function body string",
  "chart_config": { ... },
  "metrics_code": "function body string returning [{label, value, unit}]"
}`

// ─────────────────────────────────────────────
// SYNTHESIZER
// ─────────────────────────────────────────────

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
// SHARED: Build ride context from data summary
// ─────────────────────────────────────────────

function buildRideContext(dataSummary) {
  const rideContext = []
  if (!dataSummary.fields?.latitude && !dataSummary.fields?.longitude) {
    rideContext.push('INDOOR (no GPS)')
  }
  if (dataSummary.fields?.altitude) {
    const altRange = dataSummary.fields.altitude.max - dataSummary.fields.altitude.min
    if (altRange < 20) rideContext.push('FLAT (<20m elevation)')
    else if (altRange > 500) rideContext.push('MOUNTAINOUS (>500m elevation)')
    else rideContext.push(`ROLLING (~${Math.round(altRange)}m elevation range)`)
  }
  if (!dataSummary.fields?.power) rideContext.push('NO POWER METER')
  if (!dataSummary.fields?.heart_rate) rideContext.push('NO HR MONITOR')
  if (!dataSummary.fields?.cadence) rideContext.push('NO CADENCE SENSOR')
  if (dataSummary.fields?.temperature) rideContext.push('HAS TEMPERATURE')

  const fieldRanges = Object.entries(dataSummary.fields || {})
    .filter(([k]) => !['latitude', 'longitude'].includes(k))
    .map(([k, v]) => `${k}: min=${v.min} max=${v.max} avg=${v.avg}`)
    .join('\n')

  const fieldsAvailable = Object.keys(dataSummary.fields || {})
    .filter(f => f !== 'latitude' && f !== 'longitude')

  return { rideContext, fieldRanges, fieldsAvailable }
}

// ─────────────────────────────────────────────
// PHASE 1: PLAN
// ─────────────────────────────────────────────

async function planAnalysis(instruction, dataSummary, samplePoints, anthropic, history) {
  const startTime = Date.now()

  const messages = []
  if (history && history.length > 0) {
    for (const msg of history.slice(-6)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      })
    }
  }

  const { rideContext, fieldRanges, fieldsAvailable } = buildRideContext(dataSummary)

  messages.push({
    role: 'user',
    content: `## ATHLETE'S QUESTION
${instruction}

## RIDE CHARACTERISTICS
${rideContext.length > 0 ? rideContext.join(', ') : 'Standard outdoor ride'}
Points: ${dataSummary.point_count}, Duration: ${Math.round(dataSummary.duration_seconds / 60)}min, Distance: ${dataSummary.distance_km}km, Sample rate: ~${dataSummary.sample_rate}s

## AVAILABLE DATA FIELDS
${fieldsAvailable.join(', ')}

## FIELD RANGES
${fieldRanges}

## SAMPLE POINTS (structure reference — first 5)
${JSON.stringify(samplePoints.slice(0, 5), null, 2)}`
  })

  const response = await anthropic.messages.create({
    model: OPUS_MODEL,
    max_tokens: 4096,
    temperature: 0.9,
    system: [{ type: 'text', text: PLANNER_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages
  })

  const usage = response.usage || {}
  const elapsed = Date.now() - startTime

  console.log(`[code-agent] PLAN (Opus): ${elapsed}ms, in=${usage.input_tokens} out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens || 0}`)

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  const result = parseJSON(text)
  if (!result || !result.technical_plan) {
    throw new Error('Planner returned invalid output')
  }

  return {
    plan: result,
    timing: {
      planner_ms: elapsed,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read: usage.cache_read_input_tokens || 0,
      cache_creation: usage.cache_creation_input_tokens || 0
    }
  }
}

// ─────────────────────────────────────────────
// PHASE 2: GENERATE CODE
// ─────────────────────────────────────────────

async function generateCode(instruction, dataSummary, samplePoints, plan, anthropic) {
  const startTime = Date.now()

  const { rideContext, fieldRanges, fieldsAvailable } = buildRideContext(dataSummary)

  const messages = [{
    role: 'user',
    content: `## ANALYSIS PLAN (from coach/planner)
${JSON.stringify(plan.technical_plan, null, 2)}

## ORIGINAL QUESTION
${instruction}

## RIDE DATA
${rideContext.length > 0 ? rideContext.join(', ') : 'Standard outdoor ride'}
Points: ${dataSummary.point_count}, Duration: ${Math.round(dataSummary.duration_seconds / 60)}min, Distance: ${dataSummary.distance_km}km, Sample rate: ~${dataSummary.sample_rate}s
Fields: ${fieldsAvailable.join(', ')}

## FIELD RANGES
${fieldRanges}

## SAMPLE POINTS (structure reference)
${JSON.stringify(samplePoints.slice(0, 5), null, 2)}

Implement the analysis plan above. Generate extraction_code, metrics_code, and chart_config.`
  }]

  const response = await anthropic.messages.create({
    model: OPUS_MODEL,
    max_tokens: 16384,
    temperature: 0.3,
    system: [{ type: 'text', text: CODEGEN_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages
  })

  const usage = response.usage || {}
  const elapsed = Date.now() - startTime

  console.log(`[code-agent] GENERATE (Opus): ${elapsed}ms, in=${usage.input_tokens} out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens || 0}`)

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  const result = parseJSON(text)
  if (!result || !result.extraction_code) {
    throw new Error('Code generator returned invalid output')
  }

  return {
    extraction_code: result.extraction_code,
    metrics_code: result.metrics_code || 'return []',
    chart_config: result.chart_config,
    timing: {
      codegen_ms: elapsed,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read: usage.cache_read_input_tokens || 0,
      cache_creation: usage.cache_creation_input_tokens || 0
    }
  }
}

// ─────────────────────────────────────────────
// CONVERSATIONAL (no file data — stays on Haiku)
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
    const { message, dataSummary, samplePoints, history = [], mode = 'analyze', phase, plan } = body

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }
    }

    const anthropic = new Anthropic({ apiKey })

    // ─── CHAT (no file data) ──────────────────
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

    // ─── PHASE 1: PLAN ────────────────────────
    if (phase === 'plan') {
      try {
        const result = await planAnalysis(message, dataSummary, samplePoints || [], anthropic, history)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'plan',
            plan: result.plan,
            timing: result.timing,
            timestamp: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('[code-agent] Plan error:', err.message)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'error',
            response: 'Failed to plan the analysis. Please try rephrasing your request.',
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    // ─── PHASE 2: GENERATE ────────────────────
    if (phase === 'generate') {
      if (!plan) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Plan is required for generate phase' }) }
      }

      try {
        const result = await generateCode(message, dataSummary, samplePoints || [], plan, anthropic)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'visualization',
            extraction_code: result.extraction_code,
            metrics_code: result.metrics_code,
            chart_config: result.chart_config,
            timing: result.timing,
            timestamp: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('[code-agent] Generate error:', err.message)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'error',
            response: 'Failed to generate analysis code. Please try rephrasing your request.',
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    // ─── LEGACY: single-call mode (no phase specified) ─────
    // Run both phases sequentially for backward compat
    try {
      const planResult = await planAnalysis(message, dataSummary, samplePoints || [], anthropic, history)
      const codeResult = await generateCode(message, dataSummary, samplePoints || [], planResult.plan, anthropic)

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'visualization',
          extraction_code: codeResult.extraction_code,
          metrics_code: codeResult.metrics_code,
          chart_config: codeResult.chart_config,
          plan: planResult.plan,
          timing: {
            planner_ms: planResult.timing.planner_ms,
            codegen_ms: codeResult.timing.codegen_ms,
            total_ms: planResult.timing.planner_ms + codeResult.timing.codegen_ms
          },
          timestamp: new Date().toISOString()
        })
      }
    } catch (err) {
      console.error('[code-agent] Pipeline error:', err.message)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          response: 'Failed to generate analysis. Please try rephrasing your request.',
          timestamp: new Date().toISOString()
        })
      }
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
