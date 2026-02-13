// Lucy Code Agent — Activity File Analysis Pipeline
// Stage 1: Planner (LLM) — understands the question + file data, decides what to extract/visualize
// Stage 2: Code Generator (LLM) — writes extraction code + chart config
// Stage 3: Inspector (LLM) — reviews generated code for safety and correctness
//
// File parsing happens CLIENT-SIDE (binary FIT files can't be sent as JSON).
// The client sends a data summary + sample points. The LLM generates code
// that runs in a client-side sandbox against the full parsed data.

import Anthropic from '@anthropic-ai/sdk'

const PLANNER_MODEL = 'claude-haiku-4-5-20251001'
const CODE_GEN_MODEL = 'claude-sonnet-4-5-20250929'
const INSPECTOR_MODEL = 'claude-haiku-4-5-20251001'

// ─────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────

const PLANNER_SYSTEM = `You are a cycling data analysis planner. You receive:
- A user's question or instruction
- A summary of their uploaded activity file data (fields, ranges, sample points)
- Conversation history for context

Your job: decide WHAT to extract and HOW to visualize it.

## OUTPUT FORMAT (JSON only, no markdown)
{
  "reasoning": "Why this approach makes sense for the question",
  "extraction_goal": "What data to extract from the raw points (e.g., 'power over time', 'heart rate zones distribution')",
  "chart_type": "line | bar | area | scatter | composed | none",
  "chart_description": "What the chart should show",
  "x_axis": "Which field for X axis (e.g., 'elapsed_seconds', 'distance_km')",
  "y_axes": ["Which fields for Y axis (e.g., 'power', 'heart_rate')"],
  "transformations": ["Any data transformations needed (e.g., '30s rolling average', 'zone bucketing', 'lap splits')"],
  "additional_metrics": ["Computed values to show as text (e.g., 'average power', 'normalized power', 'time in zones')"],
  "colors": {"field_name": "#hex"},
  "title": "Chart title"
}

## RULES
1. Always pick the most appropriate chart type for the data
2. For time series data (power, HR, speed), prefer line or area charts
3. For distributions (zones, histograms), prefer bar charts
4. For correlations (power vs HR), prefer scatter charts
5. Use "composed" when overlaying different chart types (e.g., area for power + line for HR)
6. When no chart makes sense, use "none" and focus on additional_metrics
7. Suggest rolling averages for noisy data (power especially)
8. Think about what transformations make the data more useful
9. The x_axis and y_axes must reference fields that exist in the data summary`

const CODE_GEN_SYSTEM = `You are a JavaScript code generator for cycling data analysis. You receive:
- A plan (what to extract, chart type, axes, transformations)
- A data summary (available fields, ranges, sample points)
- Sample data points

You must generate TWO things:

## 1. EXTRACTION CODE
A JavaScript function body that:
- Receives \`data\` (array of point objects) as its only argument
- Returns an array of objects suitable for Recharts
- Each returned object should have the fields needed for the chart axes
- Apply any transformations (rolling averages, zone bucketing, resampling, etc.)

The code runs in a sandbox via \`new Function('data', yourCode)\`.
You CANNOT import anything. You CANNOT use DOM APIs. Only pure JS.

## 2. CHART CONFIG
A Recharts configuration object.

## OUTPUT FORMAT (JSON only, no markdown)
{
  "extraction_code": "the JavaScript function body as a string",
  "chart_config": {
    "type": "line|bar|area|scatter|composed",
    "title": "Chart Title",
    "xKey": "field name for X axis",
    "xLabel": "X Axis Label",
    "yLabel": "Y Axis Label",
    "series": [
      {
        "key": "field name in extracted data",
        "label": "Display name",
        "color": "#hex",
        "type": "line|bar|area",
        "strokeWidth": 2,
        "dot": false,
        "fillOpacity": 0.3
      }
    ],
    "tooltip": true,
    "legend": true,
    "grid": true,
    "brush": false,
    "referenceLines": [
      {"y": 250, "label": "FTP", "color": "#ff0000", "strokeDasharray": "5 5"}
    ]
  },
  "metrics": [
    {"label": "Average Power", "value": "computed in extraction", "unit": "W"},
    {"label": "Max Heart Rate", "value": "computed in extraction", "unit": "bpm"}
  ],
  "metrics_code": "JavaScript function body that receives data and returns an array of {label, value, unit} objects"
}

## RULES
1. extraction_code must be a FUNCTION BODY (not a function declaration). It receives \`data\` and must \`return\` the result.
2. The returned data must be an array of flat objects with the keys referenced in chart_config.series[].key and chart_config.xKey
3. For rolling averages, implement a simple moving average inline
4. For zone distributions, create buckets and count points in each
5. Limit output array to ~500 points max by resampling if needed (take every Nth point)
6. metrics_code receives \`data\` (the raw points) and returns [{label, value, unit}]
7. Always include null checks: some fields may be missing on some points
8. Use clean variable names and simple logic
9. Do NOT use arrow functions in the top level — use regular variable assignments
10. Always return from both extraction_code and metrics_code`

const INSPECTOR_SYSTEM = `You are a code safety inspector for a cycling data analysis tool. You review JavaScript code that will run in a browser sandbox (via new Function()).

Review the code for:
1. SAFETY: No DOM access, no fetch/XMLHttpRequest, no eval(), no Function constructor, no prototype pollution
2. CORRECTNESS: Returns an array of objects, handles null/undefined fields, won't throw on edge cases
3. PERFORMANCE: Won't create infinite loops, handles large arrays efficiently, resamples if needed

## OUTPUT FORMAT (JSON only)
{
  "safe": true|false,
  "issues": ["list of issues found, empty if safe"],
  "suggestions": ["optional improvements"],
  "approved_extraction_code": "the code, possibly with minor fixes applied",
  "approved_metrics_code": "the metrics code, possibly with minor fixes applied"
}

## AUTO-FIX RULES
- If code is mostly fine but has minor issues, fix them and set safe=true
- Add try/catch wrapper if missing
- Add null checks for field access if missing
- Add resampling if the code doesn't limit output size
- If code is fundamentally broken or unsafe, set safe=false`

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

  let plan
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

    plannerMessages.push({
      role: 'user',
      content: `## USER INSTRUCTION
${instruction}

## DATA SUMMARY
${JSON.stringify(dataSummary, null, 2)}

## SAMPLE POINTS (first 5)
${JSON.stringify(samplePoints.slice(0, 5), null, 2)}`
    })

    const plannerResponse = await anthropic.messages.create({
      model: PLANNER_MODEL,
      max_tokens: 1500,
      system: PLANNER_SYSTEM,
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

  stages.planner = {
    ms: Date.now() - plannerStart,
    reasoning: plan.reasoning,
    chart_type: plan.chart_type,
    title: plan.title
  }

  console.log(`[code-agent] Stage 1 Planner: ${stages.planner.ms}ms, chart_type=${plan.chart_type}`)

  // ─── STAGE 2: CODE GENERATOR ─────────────────────────
  const codeGenStart = Date.now()

  let codeOutput
  try {
    const codeGenResponse = await anthropic.messages.create({
      model: CODE_GEN_MODEL,
      max_tokens: 4096,
      system: CODE_GEN_SYSTEM,
      messages: [{
        role: 'user',
        content: `## PLAN
${JSON.stringify(plan, null, 2)}

## DATA SUMMARY
${JSON.stringify(dataSummary, null, 2)}

## SAMPLE POINTS
${JSON.stringify(samplePoints.slice(0, 10), null, 2)}`
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

  stages.code_gen = {
    ms: Date.now() - codeGenStart,
    has_extraction: !!codeOutput.extraction_code,
    has_metrics: !!codeOutput.metrics_code,
    series_count: (codeOutput.chart_config?.series || []).length
  }

  console.log(`[code-agent] Stage 2 Code Gen: ${stages.code_gen.ms}ms, ${stages.code_gen.series_count} series`)

  // ─── STAGE 3: INSPECTOR ──────────────────────────────
  const inspectorStart = Date.now()

  let inspected
  try {
    const inspectorResponse = await anthropic.messages.create({
      model: INSPECTOR_MODEL,
      max_tokens: 4096,
      system: INSPECTOR_SYSTEM,
      messages: [{
        role: 'user',
        content: `## EXTRACTION CODE
\`\`\`javascript
${codeOutput.extraction_code}
\`\`\`

## METRICS CODE
\`\`\`javascript
${codeOutput.metrics_code || 'return []'}
\`\`\`

## DATA SUMMARY (for context)
Fields available: ${Object.keys(dataSummary.fields || {}).join(', ')}
Point count: ${dataSummary.point_count || 'unknown'}`
      }]
    })

    const inspectorText = inspectorResponse.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    inspected = parseJSON(inspectorText)
    if (!inspected) {
      throw new Error('Inspector returned invalid JSON')
    }
  } catch (err) {
    console.error('[code-agent] Inspector error, using original code:', err.message)
    inspected = {
      safe: true,
      issues: [],
      suggestions: ['Inspector failed — using original code'],
      approved_extraction_code: codeOutput.extraction_code,
      approved_metrics_code: codeOutput.metrics_code || 'return []'
    }
  }

  stages.inspector = {
    ms: Date.now() - inspectorStart,
    safe: inspected.safe,
    issues: inspected.issues || [],
    suggestions: inspected.suggestions || []
  }

  console.log(`[code-agent] Stage 3 Inspector: ${stages.inspector.ms}ms, safe=${inspected.safe}, ${(inspected.issues || []).length} issues`)

  if (!inspected.safe) {
    return {
      error: 'Generated code did not pass safety inspection. Issues: ' + (inspected.issues || []).join('; '),
      stages,
      timing: { total_ms: Date.now() - startTime }
    }
  }

  // ─── RESULT PACKAGE ──────────────────────────────────
  const totalMs = Date.now() - startTime

  return {
    extraction_code: inspected.approved_extraction_code || codeOutput.extraction_code,
    metrics_code: inspected.approved_metrics_code || codeOutput.metrics_code || 'return []',
    chart_config: codeOutput.chart_config,
    plan,
    stages,
    timing: {
      planner_ms: stages.planner.ms,
      code_gen_ms: stages.code_gen.ms,
      inspector_ms: stages.inspector.ms,
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
      model: PLANNER_MODEL,
      max_tokens: 500,
      system: SYNTHESIZER_SYSTEM,
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

    // Full pipeline: Plan → Generate → Inspect
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
          chart_type: result.plan.chart_type,
          title: result.plan.title,
          extraction_goal: result.plan.extraction_goal
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
