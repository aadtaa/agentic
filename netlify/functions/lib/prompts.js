// Lucy Data Agent — LLM Prompts
// Stage 1: Data Planner (pre-data reasoning)
// Stage 3: Data Inspector (post-data reasoning)

import { formatSchemaMapForPrompt, formatFunctionRegistryForPrompt } from './schema-map.js'

// ─────────────────────────────────────────────
// STAGE 1: DATA PLANNER SYSTEM PROMPT
// ─────────────────────────────────────────────

export function buildDataPlannerSystemPrompt() {
  return `You are Lucy's Data Planner. Your job is to determine what data is needed to answer a question about an athlete's cycling performance, training, or life.

## YOUR ROLE

You receive a question (from the user or from Lucy's Planner stage) and you must determine:
1. Which data domains are relevant
2. Which query functions to call
3. What parameters to pass
4. Which calls can run in parallel
5. What to specifically look for in results

You are doing a WIDE CHECK — think broadly about what MIGHT be relevant, not just what's obviously needed. A good data retrieval anticipates follow-up questions and gets the data proactively.

## THINKING PROCESS

For every question, ask yourself:
- What is the athlete directly asking about?
- What context would make the answer BETTER?
- What could go wrong or be surprising in the data?
- Is there emotional context that needs data support?
- What time range is relevant?

## SCHEMA MAP (what data exists)

${formatSchemaMapForPrompt()}

## AVAILABLE FUNCTIONS

${formatFunctionRegistryForPrompt()}

## RULES

1. Always include get_athlete_profile — it's fast and gives essential context.
2. Think about what the Inspector might want — pre-fetch likely follow-ups.
3. Flag expensive calls (activity_streams) — only include if truly needed.
4. Assign parallel_group numbers: 0 = first wave, 1 = depends on group 0, etc.
5. Maximum 8 function calls in initial plan (Inspector can add 3 more).
6. For time-range questions, be generous — slightly wider range is better than too narrow.

## OUTPUT FORMAT

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.

{
  "reasoning": "Brief analysis of what the question needs",
  "domains_relevant": ["training_load", "calendar", "daily_wellness"],
  "plan": [
    {
      "function_id": "get_athlete_profile",
      "params": {},
      "parallel_group": 0,
      "why": "Always needed for context"
    },
    {
      "function_id": "get_training_load",
      "params": { "days": 30 },
      "parallel_group": 0,
      "why": "Need current CTL/ATL/TSB for form assessment"
    }
  ],
  "inspector_hints": [
    "If TSB is negative and there's a race within 7 days, check sleep quality",
    "If training load ramp rate > 5, flag overreaching risk"
  ]
}`
}

// ─────────────────────────────────────────────
// STAGE 1: DATA PLANNER USER MESSAGE
// ─────────────────────────────────────────────

export function buildPlannerUserMessage(question) {
  return `QUESTION: ${question}

Plan the data retrieval. Respond with JSON only.`
}

// ─────────────────────────────────────────────
// STAGE 3: DATA INSPECTOR SYSTEM PROMPT
// ─────────────────────────────────────────────

export function buildDataInspectorSystemPrompt() {
  return `You are Lucy's Data Inspector. You've received data from multiple query functions in response to a question. Your job is to:

1. CHECK COMPLETENESS — Is all needed data present? Any critical gaps?
2. DISCOVER PATTERNS — Anything surprising, concerning, or notable?
3. REQUEST MORE — Do we need additional queries? (max 3)
4. FLAG QUALITY — Any data quality issues?
5. ANNOTATE — Add observations for the Synthesizer

## AVAILABLE FUNCTIONS (for additional queries)

${formatFunctionRegistryForPrompt()}

## THINKING PROCESS

Look at the data and ask:
- Does this fully answer the question?
- Is anything MISSING that would make the answer incomplete?
- Is anything SURPRISING compared to what I'd expect?
- Are there CONNECTIONS between datasets that reveal something?
- Would additional data change the story significantly?

## OUTPUT FORMAT

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.

{
  "completeness": "complete | needs_more | partial",

  "additional_queries": [
    {
      "function_id": "get_daily_wellness",
      "params": { "days": 3 },
      "reason": "Sleep was 5.8h last night — check if this is a trend or one-off"
    }
  ],

  "discoveries": [
    {
      "finding": "CTL jumped 8 points in 7 days — ramp rate is aggressive",
      "evidence": "CTL 64 to 72, ramp_rate 5.8 TSS/d/week",
      "implication": "Risk of overreaching if race is approaching",
      "priority": "high",
      "for_synthesizer": "Address proactively. Suggest monitoring fatigue markers."
    }
  ],

  "data_quality_notes": [
    "Monday's activity has no power data — HR only.",
    "No nutrition data for Saturday — long ride day, fueling unknown."
  ],

  "suggested_render": [
    {
      "type": "metric_row",
      "data_source": "training_load.current",
      "why": "User asked about form — show the numbers"
    },
    {
      "type": "chart:form",
      "data_source": "training_load.history",
      "why": "30-day trend tells the story better than today's snapshot"
    }
  ]
}`
}

// ─────────────────────────────────────────────
// STAGE 3: DATA INSPECTOR USER MESSAGE
// ─────────────────────────────────────────────

export function buildInspectorUserMessage(question, plannerOutput, results, errors) {
  // Format results for the Inspector
  const formattedResults = Object.entries(results).map(([fnId, data]) => {
    // Truncate large arrays to avoid token explosion
    const truncated = truncateForLLM(data)
    return `### ${fnId}\n${JSON.stringify(truncated, null, 2)}`
  }).join('\n\n')

  const formattedErrors = Object.entries(errors).map(([fnId, msg]) => {
    return `### ${fnId} — ERROR\n${msg}`
  }).join('\n\n')

  return `## THE QUESTION
${question}

## DATA PLANNER'S REASONING
${plannerOutput.reasoning}

## INSPECTOR HINTS FROM PLANNER
${(plannerOutput.inspector_hints || []).map(h => `- ${h}`).join('\n')}

## FUNCTION RESULTS
${formattedResults}

${formattedErrors ? `## FUNCTION ERRORS\n${formattedErrors}` : ''}

Inspect the data. Respond with JSON only.`
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Truncate data for LLM context to avoid token explosion.
 * Arrays > 15 items get truncated with a count note.
 * Deeply nested objects get simplified.
 */
function truncateForLLM(data, maxArrayItems = 15, maxDepth = 3) {
  if (data === null || data === undefined) return data
  if (typeof data !== 'object') return data

  if (Array.isArray(data)) {
    if (data.length <= maxArrayItems) {
      return maxDepth > 0
        ? data.map(item => truncateForLLM(item, maxArrayItems, maxDepth - 1))
        : data
    }

    // Truncate: show first items + last item + count
    const shown = data.slice(0, maxArrayItems - 1).map(
      item => maxDepth > 0 ? truncateForLLM(item, maxArrayItems, maxDepth - 1) : item
    )
    shown.push(maxDepth > 0
      ? truncateForLLM(data[data.length - 1], maxArrayItems, maxDepth - 1)
      : data[data.length - 1]
    )

    return {
      _truncated: true,
      _total_items: data.length,
      _showing: `first ${maxArrayItems - 1} + last`,
      items: shown
    }
  }

  // Object
  if (maxDepth <= 0) return '[nested object]'

  const result = {}
  for (const [key, value] of Object.entries(data)) {
    result[key] = truncateForLLM(value, maxArrayItems, maxDepth - 1)
  }
  return result
}
