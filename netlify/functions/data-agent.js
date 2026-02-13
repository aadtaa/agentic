// Lucy Data Agent — 4-Stage Pipeline
// Stage 1: Data Planner (LLM) — decides what data to fetch
// Stage 2: Executor (code) — runs queries in parallel
// Stage 3: Data Inspector (LLM) — reviews results, discovers patterns
// Stage 4: Result Package (code) — assembles structured output
//
// Two LLM calls, not one. The Planner reasons BEFORE data.
// The Inspector reasons AFTER data. This catches things one pass can't.

import Anthropic from '@anthropic-ai/sdk'
import {
  createAthleteContext,
  executePlan,
  executeAdditionalQueries
} from './lib/query-functions.js'
import {
  buildDataPlannerSystemPrompt,
  buildPlannerUserMessage,
  buildDataInspectorSystemPrompt,
  buildInspectorUserMessage
} from './lib/prompts.js'

const PLANNER_MODEL = 'claude-haiku-4-5-20251001'
const INSPECTOR_MODEL = 'claude-haiku-4-5-20251001'

// ─────────────────────────────────────────────
// MAIN PIPELINE
// ─────────────────────────────────────────────

async function runDataAgent(question, athleteId, anthropic) {
  const ctx = createAthleteContext(athleteId)
  const startTime = Date.now()
  const stages = {}

  // ─── STAGE 1: DATA PLANNER ─────────────────────────────
  const plannerStart = Date.now()

  let plannerOutput
  try {
    const plannerResponse = await anthropic.messages.create({
      model: PLANNER_MODEL,
      max_tokens: 2048,
      system: buildDataPlannerSystemPrompt(),
      messages: [{ role: 'user', content: buildPlannerUserMessage(question) }]
    })

    const plannerText = plannerResponse.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    plannerOutput = parseJSON(plannerText)
    if (!plannerOutput || !plannerOutput.plan) {
      throw new Error('Planner returned invalid plan')
    }
  } catch (err) {
    // Fallback: minimal plan with just athlete profile
    console.error('[data-agent] Planner error, using fallback:', err.message)
    plannerOutput = {
      reasoning: 'Planner failed — using minimal fallback plan',
      domains_relevant: ['athlete_profile'],
      plan: [
        { function_id: 'get_athlete_profile', params: {}, parallel_group: 0, why: 'Fallback' }
      ],
      inspector_hints: []
    }
  }

  stages.planner = {
    ms: Date.now() - plannerStart,
    reasoning: plannerOutput.reasoning,
    functions_planned: plannerOutput.plan.map(p => p.function_id),
    domains: plannerOutput.domains_relevant
  }

  console.log(`[data-agent] Stage 1 Planner: ${stages.planner.ms}ms, ${plannerOutput.plan.length} functions planned`)

  // ─── STAGE 2: EXECUTOR ─────────────────────────────────
  const executorStart = Date.now()

  const { results, errors } = await executePlan(plannerOutput.plan, ctx)

  stages.executor = {
    ms: Date.now() - executorStart,
    succeeded: Object.keys(results),
    failed: Object.keys(errors)
  }

  console.log(`[data-agent] Stage 2 Executor: ${stages.executor.ms}ms, ${stages.executor.succeeded.length} ok, ${stages.executor.failed.length} failed`)

  // ─── STAGE 3: DATA INSPECTOR ───────────────────────────
  const inspectorStart = Date.now()

  let inspectorOutput
  try {
    const inspectorResponse = await anthropic.messages.create({
      model: INSPECTOR_MODEL,
      max_tokens: 2048,
      system: buildDataInspectorSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildInspectorUserMessage(question, plannerOutput, results, errors)
      }]
    })

    const inspectorText = inspectorResponse.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    inspectorOutput = parseJSON(inspectorText)
    if (!inspectorOutput) {
      throw new Error('Inspector returned invalid JSON')
    }
  } catch (err) {
    console.error('[data-agent] Inspector error, using fallback:', err.message)
    inspectorOutput = {
      completeness: 'partial',
      additional_queries: [],
      discoveries: [],
      data_quality_notes: [`Inspector failed: ${err.message}`],
      suggested_render: []
    }
  }

  stages.inspector = {
    ms: Date.now() - inspectorStart,
    completeness: inspectorOutput.completeness,
    discoveries_count: (inspectorOutput.discoveries || []).length,
    additional_requested: (inspectorOutput.additional_queries || []).length
  }

  console.log(`[data-agent] Stage 3 Inspector: ${stages.inspector.ms}ms, completeness=${inspectorOutput.completeness}, ${stages.inspector.discoveries_count} discoveries`)

  // ─── STAGE 2B: ADDITIONAL QUERIES (if Inspector requests) ──
  let additionalMs = 0
  if (inspectorOutput.additional_queries && inspectorOutput.additional_queries.length > 0) {
    const addStart = Date.now()

    const additional = await executeAdditionalQueries(
      inspectorOutput.additional_queries,
      ctx
    )

    // Merge additional results
    Object.assign(results, additional.results)
    Object.assign(errors, additional.errors)

    additionalMs = Date.now() - addStart
    console.log(`[data-agent] Stage 2B Additional: ${additionalMs}ms, ${Object.keys(additional.results).length} more results`)
  }

  stages.additional_executor = {
    ms: additionalMs,
    functions: (inspectorOutput.additional_queries || []).map(q => q.function_id)
  }

  // ─── STAGE 4: RESULT PACKAGE ───────────────────────────
  const totalMs = Date.now() - startTime

  const result = {
    function_results: results,
    discoveries: inspectorOutput.discoveries || [],
    data_quality_notes: [
      ...Object.entries(errors).map(([fn, err]) => `${fn}: ${err}`),
      ...(inspectorOutput.data_quality_notes || [])
    ],
    suggested_renders: inspectorOutput.suggested_render || [],
    planner: {
      reasoning: plannerOutput.reasoning,
      domains: plannerOutput.domains_relevant,
      functions_planned: plannerOutput.plan.map(p => p.function_id),
      inspector_hints: plannerOutput.inspector_hints || []
    },
    inspector: {
      completeness: inspectorOutput.completeness,
      discoveries: inspectorOutput.discoveries || [],
      additional_queries: (inspectorOutput.additional_queries || []).map(q => ({
        function_id: q.function_id,
        reason: q.reason
      }))
    },
    timing: {
      planner_ms: stages.planner.ms,
      executor_ms: stages.executor.ms,
      inspector_ms: stages.inspector.ms,
      additional_executor_ms: additionalMs,
      total_ms: totalMs
    }
  }

  console.log(`[data-agent] Pipeline complete: ${totalMs}ms total`)

  return result
}

// ─────────────────────────────────────────────
// SYNTHESIZER — Formats the data into a response
// ─────────────────────────────────────────────

const SYNTHESIZER_MODEL = 'claude-sonnet-4-5-20250929'

const SYNTHESIZER_SYSTEM_PROMPT = `You are Lucy's Data Analysis Agent — a specialized AI for exploring, querying, and analyzing cycling and endurance sports data.

## YOUR ROLE
You receive pre-fetched data from Lucy's Data Agent pipeline. The data has already been retrieved and inspected. Your job is to:
- Interpret the data and answer the athlete's question
- Highlight patterns, trends, and anomalies the Data Inspector discovered
- Present data clearly using tables, lists, and structured formats
- Be specific with numbers and units
- Suggest follow-up analyses when you spot something interesting

## DATA YOU RECEIVE
- **function_results**: Raw data from query functions, organized by function ID
- **discoveries**: Patterns and anomalies the Data Inspector found (with priority and implications)
- **data_quality_notes**: What data is missing, incomplete, or potentially unreliable
- **planner reasoning**: Why these specific data domains were retrieved

## PERSONALITY
- Analytical and precise — data-first, always back claims with numbers
- Proactive — suggest follow-up analyses when you spot interesting patterns
- Clear — present complex data in digestible formats
- Honest about limitations — if data is missing, say what you'd need

## RESPONSE FORMAT
Use rich markdown:
- **Tables** for multi-column data comparisons
- **Bold** for key metrics and values
- **Headers** (##, ###) for sections in longer responses
- **Lists** for findings and recommendations
- Always include units: **285W**, **72.5kg**, **6.5 hours**

## DISCOVERIES
When the Data Inspector found discoveries, ALWAYS address them. They are flagged by priority:
- **high**: Address prominently — this affects the answer significantly
- **medium**: Mention and contextualize
- **low**: Include if relevant to the question

## RULES
1. Never make up data not in the function_results.
2. When presenting trends, show the direction AND magnitude of change.
3. Flag concerning patterns clearly.
4. Keep it concise — don't dump raw data, interpret it.
5. DO NOT use emojis. Keep it clean and professional.
6. If a function returned an error, work around it or note the gap naturally.
7. Reference specific numbers from the data to support every claim.`

async function synthesizeResponse(question, agentResult, anthropic, history) {
  // Build the context for the Synthesizer
  const dataContext = buildSynthesizerContext(agentResult)

  const messages = []

  // Include conversation history if provided
  if (history && history.length > 0) {
    for (const msg of history) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    }
  }

  // Current message with data context
  messages.push({
    role: 'user',
    content: `${question}\n\n---\n\n${dataContext}`
  })

  const response = await anthropic.messages.create({
    model: SYNTHESIZER_MODEL,
    max_tokens: 4096,
    system: SYNTHESIZER_SYSTEM_PROMPT,
    messages
  })

  return response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
}

function buildSynthesizerContext(agentResult) {
  const sections = []

  // Planner reasoning
  sections.push(`## DATA RETRIEVAL CONTEXT\n**Reasoning:** ${agentResult.planner.reasoning}\n**Domains queried:** ${agentResult.planner.domains.join(', ')}`)

  // Discoveries (highest priority first)
  if (agentResult.discoveries.length > 0) {
    const sorted = [...agentResult.discoveries].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2)
    })

    sections.push('## DISCOVERIES (from Data Inspector)\n' +
      sorted.map(d =>
        `### [${(d.priority || 'medium').toUpperCase()}] ${d.finding}\n` +
        `**Evidence:** ${d.evidence}\n` +
        `**Implication:** ${d.implication}\n` +
        (d.for_synthesizer ? `**Note:** ${d.for_synthesizer}` : '')
      ).join('\n\n'))
  }

  // Function results
  sections.push('## FUNCTION RESULTS\n' +
    Object.entries(agentResult.function_results).map(([fnId, data]) => {
      const json = JSON.stringify(data, null, 2)
      // Limit individual result size for the Synthesizer
      const truncated = json.length > 4000
        ? json.substring(0, 4000) + '\n... [truncated, ' + json.length + ' chars total]'
        : json
      return `### ${fnId}\n\`\`\`json\n${truncated}\n\`\`\``
    }).join('\n\n'))

  // Data quality notes
  if (agentResult.data_quality_notes.length > 0) {
    sections.push('## DATA QUALITY NOTES\n' +
      agentResult.data_quality_notes.map(n => `- ${n}`).join('\n'))
  }

  return sections.join('\n\n')
}

// ─────────────────────────────────────────────
// ROBUST JSON PARSER
// ─────────────────────────────────────────────

function parseJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch (e) {
    // Try extracting JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1])
      } catch (e2) { /* fall through */ }
    }

    // Try finding JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e3) { /* fall through */ }
    }

    return null
  }
}

// ─────────────────────────────────────────────
// NETLIFY FUNCTION HANDLER
// ─────────────────────────────────────────────

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { message, history = [], mode = 'full' } = JSON.parse(event.body)

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }
    }

    const anthropic = new Anthropic({ apiKey })

    // Run the 4-stage Data Agent pipeline
    const agentResult = await runDataAgent(message, null, anthropic)

    if (mode === 'data_only') {
      // Return raw pipeline results (for use by other pipeline stages)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agentResult,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Default: synthesize into a human-readable response
    const synthesizeStart = Date.now()
    const response = await synthesizeResponse(message, agentResult, anthropic, history)
    const synthesizeMs = Date.now() - synthesizeStart

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response,
        pipeline: {
          planner: agentResult.planner,
          discoveries: agentResult.discoveries,
          data_quality_notes: agentResult.data_quality_notes,
          suggested_renders: agentResult.suggested_renders,
          timing: {
            ...agentResult.timing,
            synthesizer_ms: synthesizeMs,
            total_ms: agentResult.timing.total_ms + synthesizeMs
          }
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('[data-agent] Error:', error)

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
