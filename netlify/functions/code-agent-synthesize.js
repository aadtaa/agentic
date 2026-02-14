// Code Agent Synthesis — called after client-side code execution
// Takes the computed metrics + plan context and generates a brief insight

import Anthropic from '@anthropic-ai/sdk'

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

export async function handler(event) {
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

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYNTHESIZER_SYSTEM,
      messages: [{
        role: 'user',
        content: `## USER ASKED
${instruction}

## CHART
${plan?.title || 'Activity Analysis'} (${plan?.chart_type || 'chart'}) — ${plan?.intent || plan?.design || ''}

## COMPUTED METRICS
${JSON.stringify(metrics, null, 2)}`
      }]
    })

    const insight = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insight })
    }
  } catch (error) {
    console.error('[code-agent-synthesize] Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Synthesis failed' })
    }
  }
}
