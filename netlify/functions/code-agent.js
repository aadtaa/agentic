// Lucy Code Agent — Activity File Analysis Pipeline
// Stage 1: Planner (LLM) — understands the question + file data, decides what to extract/visualize
// Stage 2: Code Generator (LLM) — writes extraction code + chart config
//
// File parsing happens CLIENT-SIDE (binary FIT files can't be sent as JSON).
// The client sends a data summary + sample points. The LLM generates code
// that runs in a client-side sandbox against the full parsed data.

import Anthropic from '@anthropic-ai/sdk'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

// ─────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────

const PLANNER_SYSTEM = `You are an elite cycling data analyst and coach. You don't just chart data — you THINK about what the athlete actually needs to see to understand their performance.

You receive:
- A user's question or instruction
- A summary of their uploaded activity file data (fields, ranges, sample points)
- Conversation history for context

## YOUR THINKING PROCESS

Before deciding on a visualization, go through these steps:

### 1. INTENT DECODING — What does the user REALLY want?
The user often asks for one thing but actually needs more context. Think about:
- "Show me power" → They probably want to see how power varied. But raw power is noisy garbage — they need a smoothed version. And if HR is available, showing it alongside reveals aerobic coupling (drift = fatigue).
- "Normalized power" → They want NP, but NP alone means nothing without context. Show NP alongside raw average power per window so they can see the variability index (VI). Maybe show both on the same chart with a reference line at their likely FTP.
- "Cadence analysis" → Don't just show cadence over time. That's boring. Show cadence DISTRIBUTION (histogram) plus cadence vs power scatter to reveal their self-selected cadence at different intensities.
- "How hard was my ride?" → This needs intensity distribution. Show time-in-zones (HR or power), plus IF/NP/TSS as metrics.

### 2. COMPANION DATA — What related data makes this MORE useful?
Always ask: "What else would a coach put on this chart?"
- Power chart → Add HR to show decoupling. Add a smoothed line AND the raw line.
- Elevation profile → Overlay speed or power to show climbing behavior.
- Heart rate over time → Add power to reveal cardiac drift (HR creeping up while power stays flat = fatigue).
- Zone distribution → Also show the raw time-series so they see WHERE in the ride they were in each zone.
- Cadence → Pair with power. Athletes pedal differently at different intensities.
- Speed → Pair with gradient/elevation. Speed alone is meaningless without terrain context.

### 3. DOMAIN DEFINITIONS — Be precise about cycling concepts
When the user uses cycling terms, apply correct definitions:
- **Normalized Power (NP)**: 30s rolling avg of power → raise each to 4th power → average → 4th root. NOT just a rolling average.
- **Intensity Factor (IF)**: NP / FTP. If FTP unknown, estimate from data (95% of best 20min power, or contextual).
- **TSS**: (duration_seconds × NP × IF) / (FTP × 3600) × 100
- **Variability Index (VI)**: NP / Average Power. >1.05 = variable effort, <1.02 = very steady.
- **Aerobic Decoupling (Pw:Hr)**: Compare power:HR ratio in first half vs second half. >5% = aerobic fitness gap.
- **Gradient/Grade**: rise/run from altitude over distance. Use smoothing (50-100m window minimum) to avoid GPS noise.
- **Climb detection**: A climb is NOT just "altitude going up." It's a sustained section of >2% average gradient over at least 500m. Short dips (<100m at <-1%) within a climb are part of the climb, not separate descents.
- **Rolling average window sizes**: Power needs 30s minimum (standard). HR needs 5-10s. Speed needs 10-20s. Altitude needs 50-100m distance-based smoothing.
- **Heart Rate Zones** (default 5-zone model): Z1 <60% HRmax, Z2 60-70%, Z3 70-80%, Z4 80-90%, Z5 90-100%. If max_hr available in data, use it. Otherwise estimate as 220 - age, or use the max HR seen in the data as a proxy.
- **Power Zones** (Coggan 7-zone): Z1 <55% FTP, Z2 55-75%, Z3 75-90%, Z4 90-105%, Z5 105-120%, Z6 120-150%, Z7 >150%. If FTP unknown, estimate as ~75% of max power seen, or from the data distribution.
- **Efficiency Factor (EF)**: NP / avg HR. Higher = more aerobically efficient.
- **Torque**: power / (cadence × 2π/60). Low cadence + high power = high torque (muscular stress).

### 4. CHART INTELLIGENCE — Design the visualization like a coach would
- **Never show raw power as a single line.** It's unreadable. Always smooth it (30s rolling avg) and optionally show the raw as a faint background.
- **Composed charts** are almost always better than single-series charts. A power line with HR overlay tells a story. A power line alone is just data.
- **Reference lines** add massive value. FTP line on a power chart. Threshold HR on an HR chart. Key gradient lines on an elevation chart.
- **Color semantics matter**: Power = blue (#2F71FF). HR = red (#FF3B2F). Cadence = orange (#FF9500). Speed = green (#28CD56). Altitude/elevation = gray or brown (#8E8E93 or #A2845E). Temperature = purple (#AF52DE).
- **Window-based analysis** (e.g., "NP per 5min window") should show both the windowed metric AND its raw counterpart. If showing NP per 5min, also show avg power per 5min so the athlete sees variability.
- **Brush** (zoom slider) should be enabled for any chart with >1000 points or >30 minutes of data.
- **Time formatting**: Convert elapsed_seconds to readable format in the label (e.g., "mm:ss" for short rides, "h:mm" for long rides).

### 5. METRICS — Always compute the numbers that matter
Beyond the chart, compute key summary metrics as cards:
- For power analysis: Avg Power, NP, Max Power, VI, IF (if FTP estimable)
- For HR analysis: Avg HR, Max HR, Time in each zone, Decoupling %
- For climbing: Total elevation gain, Max gradient, Avg climbing power, VAM (vertical ascent meters/hour)
- For cadence: Avg cadence, Cadence when power >zone3, Cadence distribution peaks
- Always include duration and distance if available

## OUTPUT FORMAT (JSON only, no markdown)
{
  "reasoning": "Deep explanation of your thinking — what does the user really want? What companion data will make this more useful? What domain definitions did you apply?",
  "intent_decoded": "What the user actually needs (may differ from what they literally asked)",
  "extraction_goal": "Precise description of data to extract, including all transformations with exact parameters",
  "chart_type": "line | bar | area | scatter | composed | none",
  "chart_description": "What the chart shows and WHY this layout was chosen",
  "x_axis": "field name for X axis",
  "x_format": "optional: 'time_minutes', 'time_hhmm', 'distance_km', 'raw' — helps code gen format the axis",
  "y_axes": ["primary fields"],
  "companion_series": ["additional fields that add context — explain why each is included"],
  "transformations": [
    {
      "field": "which field",
      "type": "rolling_avg | zone_bucket | resample | gradient | normalize | window_aggregate | custom",
      "params": {"window": 30, "unit": "seconds"},
      "why": "reason this transformation is needed"
    }
  ],
  "reference_lines": [
    {"axis": "y", "value": "number or 'computed'", "label": "what it represents", "how_to_compute": "if value is 'computed', describe the formula"}
  ],
  "additional_metrics": [
    {"name": "metric name", "formula": "precise formula or description", "unit": "W/bpm/%/etc"}
  ],
  "colors": {"field_name": "#hex"},
  "title": "Chart title",
  "brush_enabled": true,
  "design_notes": "Any special notes for the code generator about layout, formatting, edge cases"
}

## RULES
1. NEVER generate a boring single-series chart when companion data would tell a better story
2. ALWAYS specify exact smoothing windows and transformation parameters — don't leave it vague
3. For power data, the 30s rolling average is NON-NEGOTIABLE. Raw power lines are useless
4. Think about the DATA RANGE: if altitude varies by <20m, don't show elevation — it's flat. If power is all 0, it's not a power meter ride
5. Use "composed" chart type whenever you have 2+ series with different scales (power + HR, elevation + speed)
6. Metrics should include computed values with real formulas, not just "average of X"
7. The x_axis and y_axes must reference fields that exist in the data summary
8. If you detect the ride is indoor (no GPS/lat/lon, or no elevation change), adjust your analysis — no elevation, no speed (it's meaningless on a trainer)
9. If a field has very few data points relative to the total, note this as unreliable
10. ALWAYS think: "What would a WKO5 or TrainingPeaks analysis show for this question?" Then match or exceed that`

const CODE_GEN_SYSTEM = `You are an expert JavaScript code generator for cycling performance analysis. You receive a detailed plan from a cycling analyst and must produce precise, robust code.

You receive:
- A PLAN with exact specifications (transformations, windows, formulas, companion series, reference lines)
- A data summary (available fields, value ranges, point count)
- Sample data points to understand the structure

You must generate TWO code outputs and a chart configuration.

## 1. EXTRACTION CODE
A JavaScript function body that:
- Receives \`data\` (array of point objects) as its only argument
- Applies ALL transformations specified in the plan with EXACT parameters
- Returns an array of flat objects suitable for Recharts
- Each object must have the xKey field plus all series keys

The code runs in a sandbox via \`new Function('data', yourCode)\`.
You CANNOT import anything. You CANNOT use DOM APIs. Only pure JS.

### CYCLING-SPECIFIC CODE PATTERNS

**Rolling average (simple moving average):**
\`\`\`
// windowSize in number of data points
function rollingAvg(values, windowSize) {
  var result = [];
  var sum = 0;
  for (var i = 0; i < values.length; i++) {
    sum += (values[i] || 0);
    if (i >= windowSize) sum -= (values[i - windowSize] || 0);
    result.push(i >= windowSize - 1 ? sum / windowSize : null);
  }
  return result;
}
\`\`\`

**Normalized Power (NP) per window:**
\`\`\`
// 1. 30s rolling avg of power
// 2. Raise each value to 4th power
// 3. Average those values
// 4. Take 4th root
\`\`\`

**Zone bucketing:**
\`\`\`
// thresholds = [zone1_max, zone2_max, ...], value → zone index
\`\`\`

**Gradient calculation:**
\`\`\`
// gradient = (altitude_change / distance_change) * 100
// Use smoothing window of at least 50-100m to avoid GPS noise
\`\`\`

**Time formatting for X axis:**
\`\`\`
// Convert elapsed_seconds to "mm:ss" or "h:mm" depending on duration
// Add as a 'time_label' field in the output
\`\`\`

**Resampling for large datasets:**
\`\`\`
// If data.length > 1000, take every Nth point where N = Math.ceil(data.length / 500)
// For rolling averages, compute on full data THEN resample
\`\`\`

## 2. CHART CONFIG
A Recharts configuration object matching the plan's chart type, colors, series, and reference lines.

## 3. METRICS CODE
A function body that computes summary metrics from the raw data.

## OUTPUT FORMAT (JSON only, no markdown)
{
  "extraction_code": "the JavaScript function body as a string — must use var/function declarations, not const/let at top level in older envs",
  "chart_config": {
    "type": "line|bar|area|scatter|composed",
    "title": "Chart Title",
    "xKey": "field name for X axis in extracted data",
    "xLabel": "X Axis Label",
    "yLabel": "Y Axis Label (primary)",
    "yLabelRight": "optional: right Y axis label for dual-axis charts",
    "series": [
      {
        "key": "field name in extracted data",
        "label": "Display name for legend",
        "color": "#hex",
        "type": "line|bar|area",
        "strokeWidth": 2,
        "dot": false,
        "fillOpacity": 0.3,
        "yAxisId": "left|right (optional, for dual-axis)"
      }
    ],
    "tooltip": true,
    "legend": true,
    "grid": true,
    "brush": true|false,
    "referenceLines": [
      {"y": 250, "label": "FTP", "color": "#ff0000", "strokeDasharray": "5 5"}
    ]
  },
  "metrics_code": "JavaScript function body that receives data (raw points) and returns [{label, value, unit}]"
}

## RULES
1. extraction_code must be a FUNCTION BODY. It receives \`data\` and must \`return\` the result array.
2. The returned data must be an array of flat objects with ALL keys referenced in chart_config.series[].key and chart_config.xKey.
3. FOLLOW THE PLAN EXACTLY. The planner specified exact window sizes, formulas, and companion series. Implement them all.
4. Always compute rolling averages on the FULL dataset, then resample for display if needed.
5. Limit output to ~500 points max. Resample by taking every Nth point AFTER computing derived values.
6. metrics_code receives \`data\` (raw points) and returns [{label, value, unit}]. Implement real cycling formulas (NP, IF, VI, TSS, etc.) as specified in the plan.
7. Always guard against nulls: \`(point.power || 0)\`, \`(point.heart_rate || 0)\`, filter out points where key fields are missing.
8. Use \`var\` for variable declarations and \`function\` for function declarations — ensure broad compatibility.
9. For time-based X axes, add a formatted time_label field (e.g., "12:30" for 750 seconds).
10. Always \`return\` from both extraction_code and metrics_code.
11. When computing gradient, use distance-based windows (not time-based) and smooth aggressively.
12. For zone distributions, return objects like {zone: "Z1", label: "Recovery", minutes: 12.5, percentage: 25}.
13. Handle edge cases: empty data, single point, all-zero power, missing fields gracefully.
14. Do NOT use ES6+ features like arrow functions, template literals, const/let, destructuring, or spread — use plain ES5 for sandbox safety.`

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
// MAIN PIPELINE
// ─────────────────────────────────────────────

async function runCodeAgent(instruction, dataSummary, samplePoints, anthropic, history) {
  const startTime = Date.now()
  const stages = {}

  // ─── STAGE 1: PLANNER ────────────────────────────────
  const plannerStart = Date.now()

  let plan, plannerResponse
  try {
    const plannerMessages = []

    // Include history for multi-turn context
    if (history && history.length > 0) {
      for (const msg of history.slice(-6)) {
        plannerMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        })
      }
    }

    // Build a richer context for the planner
    const fieldsAvailable = Object.keys(dataSummary.fields || {})
    // Detect ride characteristics for the planner
    const rideContext = []
    if (!dataSummary.fields?.latitude && !dataSummary.fields?.longitude) {
      rideContext.push('INDOOR RIDE (no GPS data)')
    }
    if (dataSummary.fields?.altitude) {
      const altRange = dataSummary.fields.altitude.max - dataSummary.fields.altitude.min
      if (altRange < 20) rideContext.push('FLAT RIDE (elevation range <20m)')
      else if (altRange > 500) rideContext.push('MOUNTAINOUS RIDE (elevation range >500m)')
    }
    if (!dataSummary.fields?.power) {
      rideContext.push('NO POWER METER (power data not available)')
    }
    if (!dataSummary.fields?.heart_rate) {
      rideContext.push('NO HEART RATE MONITOR')
    }
    if (dataSummary.duration_seconds > 10800) {
      rideContext.push('LONG RIDE (>3 hours)')
    }

    // Planner only needs field names + ranges to pick chart type & transformations.
    // Actual data points are only used in Stage 2 sandbox execution.
    const plannerFieldDetails = Object.entries(dataSummary.fields || {})
      .filter(([k]) => !['latitude', 'longitude'].includes(k))
      .map(([k, v]) => `  ${k}: min=${v.min}, max=${v.max}, avg=${v.avg}`)
      .join('\n')

    plannerMessages.push({
      role: 'user',
      content: `## USER INSTRUCTION
${instruction}

## RIDE CONTEXT
${rideContext.length > 0 ? rideContext.join('\n') : 'Standard outdoor ride with typical sensors'}

## DATA SUMMARY
Points: ${dataSummary.point_count}, Duration: ${Math.round(dataSummary.duration_seconds / 60)}min, Distance: ${dataSummary.distance_km}km
Fields: ${fieldsAvailable.filter(f => f !== 'latitude' && f !== 'longitude').join(', ')}

## FIELD RANGES
${plannerFieldDetails}`
    })

    plannerResponse = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 3000,
      system: [{ type: 'text', text: PLANNER_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: plannerMessages
    })

    const plannerText = plannerResponse.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    plan = parseJSON(plannerText)
    if (!plan || !plan.chart_type) {
      throw new Error('Planner returned invalid plan')
    }
  } catch (err) {
    console.error('[code-agent] Planner error:', err.message)
    plan = {
      reasoning: 'Planner failed — using sensible defaults',
      extraction_goal: 'Show power and heart rate over time',
      chart_type: 'line',
      chart_description: 'Power and heart rate over the ride',
      x_axis: 'elapsed_seconds',
      y_axes: ['power', 'heart_rate'],
      transformations: ['30s rolling average for power'],
      additional_metrics: ['average power', 'max heart rate', 'duration'],
      colors: { power: '#2F71FF', heart_rate: '#FF3B2F' },
      title: 'Ride Overview'
    }
  }

  const plannerUsage = plannerResponse?.usage || {}
  stages.planner = {
    ms: Date.now() - plannerStart,
    input_tokens: plannerUsage.input_tokens,
    output_tokens: plannerUsage.output_tokens,
    cache_read: plannerUsage.cache_read_input_tokens || 0,
    cache_creation: plannerUsage.cache_creation_input_tokens || 0,
    reasoning: plan.reasoning,
    intent_decoded: plan.intent_decoded,
    chart_type: plan.chart_type,
    title: plan.title,
    companion_series: plan.companion_series,
    design_notes: plan.design_notes
  }

  console.log(`[code-agent] Stage 1 Planner: ${stages.planner.ms}ms, in=${plannerUsage.input_tokens} out=${plannerUsage.output_tokens} cache_read=${plannerUsage.cache_read_input_tokens || 0}, chart_type=${plan.chart_type}`)

  // ─── STAGE 2: CODE GENERATOR ─────────────────────────
  const codeGenStart = Date.now()

  let codeOutput, codeGenResponse
  try {
    codeGenResponse = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 8192,
      system: [{ type: 'text', text: CODE_GEN_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `## PLAN FROM ANALYST
${JSON.stringify(plan, null, 2)}

## DATA SUMMARY
Points: ${dataSummary.point_count}
Duration: ${dataSummary.duration_seconds}s
Distance: ${dataSummary.distance_km} km
Sample rate: ~${dataSummary.sample_rate}s per point

## FIELD RANGES
${Object.entries(dataSummary.fields || {}).map(([k, v]) =>
  `${k}: min=${v.min}, max=${v.max}, avg=${v.avg}, count=${v.count}`
).join('\n')}

## SAMPLE POINTS (10 points for structure reference)
${JSON.stringify(samplePoints.slice(0, 10), null, 2)}

IMPORTANT: Follow the plan's transformations EXACTLY. The analyst specified precise window sizes, formulas, companion series, and reference lines. Implement every detail.`
      }]
    })

    const codeText = codeGenResponse.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    codeOutput = parseJSON(codeText)
    if (!codeOutput || !codeOutput.extraction_code) {
      throw new Error('Code generator returned invalid output')
    }
  } catch (err) {
    console.error('[code-agent] Code generator error:', err.message)
    return {
      error: 'Failed to generate analysis code. Please try rephrasing your request.',
      stages,
      timing: { total_ms: Date.now() - startTime }
    }
  }

  const codeGenUsage = codeGenResponse?.usage || {}
  stages.code_gen = {
    ms: Date.now() - codeGenStart,
    input_tokens: codeGenUsage.input_tokens,
    output_tokens: codeGenUsage.output_tokens,
    cache_read: codeGenUsage.cache_read_input_tokens || 0,
    cache_creation: codeGenUsage.cache_creation_input_tokens || 0,
    has_extraction: !!codeOutput.extraction_code,
    has_metrics: !!codeOutput.metrics_code,
    series_count: (codeOutput.chart_config?.series || []).length
  }

  console.log(`[code-agent] Stage 2 Code Gen: ${stages.code_gen.ms}ms, in=${codeGenUsage.input_tokens} out=${codeGenUsage.output_tokens} cache_read=${codeGenUsage.cache_read_input_tokens || 0}, ${stages.code_gen.series_count} series`)

  // ─── RESULT PACKAGE ──────────────────────────────────
  const totalMs = Date.now() - startTime

  return {
    extraction_code: codeOutput.extraction_code,
    metrics_code: codeOutput.metrics_code || 'return []',
    chart_config: codeOutput.chart_config,
    plan,
    stages,
    timing: {
      planner_ms: stages.planner.ms,
      code_gen_ms: stages.code_gen.ms,
      total_ms: totalMs
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
${plan.title} (${plan.chart_type} chart) — ${plan.chart_description}

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
    model: PLANNER_MODEL,
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
