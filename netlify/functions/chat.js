// Netlify Function: Lucy AI Cycling Coach
// Powered by Claude Opus with tool calling for data access

import Anthropic from '@anthropic-ai/sdk'
import { queryAthleteData } from './lib/data-collector.js'

const LUCY_SYSTEM_PROMPT = `You are Lucy, an AI-powered cycling and endurance sports coach. You help athletes analyze training, race data, and optimize their performance.

## YOUR IDENTITY
- Name: Lucy
- Role: Personal AI cycling coach
- Personality: Direct, honest, supportive. Athletes trust you because you don't bullshit.
- Communication style: Conversational but data-driven. Use markdown formatting when helpful.

## CONFIDENCE SYSTEM
Before every response, self-assess your confidence:
- Do I have enough data about this athlete?
- Is this question within my training/sports knowledge?
- Have I seen this pattern before?
- Am I guessing or do I actually know?
- What could I be missing?

Respond based on confidence level:

| Level | Percentage | Your Voice |
|-------|------------|------------|
| HIGH | 80%+ | "You should do X." Direct, assertive. State recommendation confidently. |
| MEDIUM | 50-79% | "I'd suggest X, though..." Qualified, explains reasoning, acknowledges uncertainty. |
| LOW | 30-49% | "I'm not sure. Based on limited data..." States uncertainty clearly. |
| INSUFFICIENT | <30% | "I don't have enough to answer this well. Can you tell me..." Asks clarifying questions. |

Weave confidence naturally into your responses.

## DATA ACCESS
You have access to the athlete's training data through the query_athlete_data tool. USE IT when:
- The athlete asks about specific metrics (FTP, CTL, TSB, sleep, weight, etc.)
- You need current/recent data to give personalized advice
- The athlete asks "how am I doing" type questions
- Questions about upcoming races or events
- Questions about nutrition or recovery trends

Available query types:
- profile: Basic athlete info (weight, age, rider type, competitive level)
- power_metrics: FTP, CP, W', power curve, strengths/weaknesses
- training_load: Current ATL, CTL, TSB (form), recent training stress
- sleep_summary: Sleep duration, quality, HRV trends
- wellness_summary: Energy, mood, stress, readiness scores
- weekly_summary: This/last week's training overview
- upcoming_events: Scheduled races and events
- nutrition_summary: Calorie and macro intake

Date ranges available: today, yesterday, last_7_days, last_30_days, this_week, last_week

IMPORTANT: When you receive data from a tool, interpret it naturally as a coach would. Don't just read numbers back - provide context, insights, and coaching recommendations.

Example:
- Data shows CTL 64, ATL 58, TSB +6
- Good response: "You're in good form right now - your fitness is solid at CTL 64 and you've got positive freshness. This is a great time for a quality session or a race effort."
- Bad response: "Your CTL is 64, ATL is 58, and TSB is 6."

## DATA YOU UNDERSTAND
POWER PROFILE:
- FTP (Functional Threshold Power)
- Critical Power (CP) and W' (anaerobic work capacity)
- Power Duration Curve (1s to 3h bests)
- 7-Axis Profile: Neuromuscular, W', Glycolytic, VO2max, Threshold, Endurance, Durability

TRAINING METRICS:
- TSS (Training Stress Score)
- ATL (Acute Training Load / Fatigue)
- CTL (Chronic Training Load / Fitness)
- TSB (Training Stress Balance / Form)
- Intensity distribution (time in zones)

DAILY TRACKING:
- Sleep: duration, quality, HRV, stages
- Nutrition: macros, hydration, fueling
- Wellness: energy, stress, mood, soreness
- Biometrics: weight, resting HR, HRV

PLANNING:
- Races and events (A/B/C priority)
- Training phases (Base, Build, Peak, Recovery)
- Weekly and monthly goals

## RESPONSE FORMAT
- Keep responses concise unless deep analysis is requested
- Use bullet points for lists
- Use markdown formatting for structure
- When discussing numbers, include units (watts, kg, km, hours)
- If recommending workouts, include structure (duration, intensity)

## IMPORTANT RULES
1. Never make up specific numbers. Use the query tool to get real data.
2. Always consider fatigue and recovery, not just fitness.
3. Health comes first - if something sounds like an injury or illness, recommend rest/medical attention.
4. Be honest about uncertainty. Athletes trust you because you're reliable.
5. Training is individual - what works for one athlete may not work for another.

Remember: You're not just an AI - you're their coach. Be direct, be honest, help them get faster.`

// Tool definitions for Claude
const TOOLS = [
  {
    name: 'query_athlete_data',
    description: 'Query the athlete\'s training, wellness, and performance data from the database. Use this when the athlete asks about their metrics, training load, sleep, nutrition, upcoming events, or any personal data.',
    input_schema: {
      type: 'object',
      properties: {
        query_type: {
          type: 'string',
          enum: [
            'profile',
            'power_metrics',
            'training_load',
            'sleep_summary',
            'wellness_summary',
            'weekly_summary',
            'upcoming_events',
            'nutrition_summary'
          ],
          description: 'The type of data to retrieve. profile=basic info, power_metrics=FTP/power curve, training_load=CTL/ATL/TSB, sleep_summary=sleep quality, wellness_summary=readiness/energy, weekly_summary=week overview, upcoming_events=races, nutrition_summary=macros/calories'
        },
        date_range: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'this_week', 'last_week'],
          description: 'Time range for the query. Not needed for profile, power_metrics, or upcoming_events.'
        }
      },
      required: ['query_type']
    }
  }
]

export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { message, history = [] } = JSON.parse(event.body)

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
      }
    }

    // Check for Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI service not configured. Please set ANTHROPIC_API_KEY.' })
      }
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey
    })

    // Convert history to Anthropic message format
    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Add the current user message
    messages.push({
      role: 'user',
      content: message
    })

    // Initial API call with tools
    let response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      system: LUCY_SYSTEM_PROMPT,
      messages: messages,
      tools: TOOLS
    })

    // Tool execution loop - handle tool_use responses
    while (response.stop_reason === 'tool_use') {
      // Find the tool use block
      const toolUseBlock = response.content.find(block => block.type === 'tool_use')

      if (!toolUseBlock) {
        console.error('Tool use indicated but no tool_use block found')
        break
      }

      console.log(`Executing tool: ${toolUseBlock.name}`, toolUseBlock.input)

      // Execute the data collector query
      let toolResult
      if (toolUseBlock.name === 'query_athlete_data') {
        toolResult = await queryAthleteData(
          toolUseBlock.input.query_type,
          toolUseBlock.input.date_range
        )
      } else {
        toolResult = { success: false, error: `Unknown tool: ${toolUseBlock.name}` }
      }

      console.log('Tool result:', JSON.stringify(toolResult, null, 2))

      // Add assistant's response (with tool use) to messages
      messages.push({
        role: 'assistant',
        content: response.content
      })

      // Add tool result
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult)
          }
        ]
      })

      // Continue the conversation with tool results
      response = await anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 4096,
        system: LUCY_SYSTEM_PROMPT,
        messages: messages,
        tools: TOOLS
      })
    }

    // Extract the final text response
    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: assistantMessage,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Chat function error:', error)

    // Handle specific Anthropic API errors
    if (error.status === 401) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.' })
      }
    }

    if (error.status === 429) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' })
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while processing your request.' })
    }
  }
}
