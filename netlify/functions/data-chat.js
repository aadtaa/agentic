// Netlify Function: Data Analysis Agent
// Specialized chatbot for querying and analyzing athlete data
// Uses the new Lucy Architecture v2.1 database schema

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const ATHLETE_ID = '00000000-0000-0000-0000-000000000001'

// New schema table whitelist (Lucy Architecture v2.1)
const ALLOWED_TABLES = [
  // Core athlete
  'athletes', 'device_connections',
  // Daily tracking
  'daily_biometrics', 'sleep_data', 'daily_nutrition', 'daily_logs',
  // Training & activities
  'activities', 'activity_streams', 'training_load', 'planned_workouts',
  // Performance profiling
  'power_duration_curve', 'performance_profile', 'signature_metrics',
  'metabolic_profiles', 'durability_metrics',
  // Calendar & events
  'calendar_events',
  // Equipment & finance
  'equipment', 'expenses', 'travel_logistics',
  // Training management
  'training_focus', 'training_summaries',
  // Food & nutrition
  'food_items',
  // AI insights
  'athlete_insights', 'athlete_knowledge'
]

// Tables without a standard 'date' field
const NON_DATE_TABLES = [
  'athletes', 'device_connections', 'equipment', 'food_items',
  'performance_profile', 'training_focus', 'athlete_knowledge'
]

// Custom date field mappings
const DATE_FIELD_MAP = {
  'activities': 'started_at',
  'activity_streams': null,
  'signature_metrics': 'tested_at',
  'metabolic_profiles': 'tested_at',
  'durability_metrics': 'measured_at',
  'calendar_events': 'date',
  'planned_workouts': 'date',
  'training_summaries': 'period_start',
  'travel_logistics': 'departure_date',
  'athlete_insights': 'valid_from',
  'expenses': 'date'
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase credentials not configured')
  return createClient(url, key)
}

function getDateRange(rangeType) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fmt = (d) => d.toISOString().split('T')[0]

  switch (rangeType) {
    case 'today':
      return { start: fmt(today), end: fmt(today) }
    case 'yesterday': {
      const d = new Date(today); d.setDate(d.getDate() - 1)
      return { start: fmt(d), end: fmt(d) }
    }
    case 'last_7_days': {
      const d = new Date(today); d.setDate(d.getDate() - 6)
      return { start: fmt(d), end: fmt(today) }
    }
    case 'last_14_days': {
      const d = new Date(today); d.setDate(d.getDate() - 13)
      return { start: fmt(d), end: fmt(today) }
    }
    case 'last_30_days': {
      const d = new Date(today); d.setDate(d.getDate() - 29)
      return { start: fmt(d), end: fmt(today) }
    }
    case 'last_90_days': {
      const d = new Date(today); d.setDate(d.getDate() - 89)
      return { start: fmt(d), end: fmt(today) }
    }
    case 'this_week': {
      const d = new Date(today)
      const day = d.getDay()
      d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
      return { start: fmt(d), end: fmt(today) }
    }
    case 'last_week': {
      const end = new Date(today)
      const day = end.getDay()
      end.setDate(end.getDate() - day + (day === 0 ? -6 : 1) - 1)
      const start = new Date(end); start.setDate(start.getDate() - 6)
      return { start: fmt(start), end: fmt(end) }
    }
    case 'this_month': {
      const d = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: fmt(d), end: fmt(today) }
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { start: fmt(start), end: fmt(end) }
    }
    default:
      return { start: fmt(new Date(today.setDate(today.getDate() - 6))), end: fmt(new Date()) }
  }
}

// Generic table query using new schema
async function queryTable(tableName, options = {}) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    return { success: false, error: `Unknown table: ${tableName}`, available_tables: ALLOWED_TABLES }
  }

  const supabase = getSupabaseClient()
  const { dateRange, limit = 50, columns } = options

  const dateField = DATE_FIELD_MAP[tableName] || 'date'
  const hasDateField = !NON_DATE_TABLES.includes(tableName) && dateField !== null

  try {
    let query = supabase.from(tableName).select(columns || '*')

    // Filter by athlete
    if (tableName === 'athletes') {
      query = query.eq('id', ATHLETE_ID)
    } else if (tableName !== 'food_items') {
      query = query.eq('athlete_id', ATHLETE_ID)
    }

    // Date filter
    if (hasDateField && dateRange) {
      const { start, end } = getDateRange(dateRange)
      query = query.gte(dateField, start).lte(dateField, end)
    }

    // Order
    const orderField = hasDateField ? dateField : 'created_at'
    query = query.order(orderField, { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error) return { success: false, error: error.message, table: tableName }
    if (!data || data.length === 0) {
      return { success: false, error: `No data in ${tableName}`, table: tableName }
    }

    return {
      success: true,
      table: tableName,
      data,
      records: data.length,
      limited: data.length === limit
    }
  } catch (err) {
    return { success: false, error: err.message, table: tableName }
  }
}

// Athlete snapshot (uses v_athlete_snapshot view or manual join)
async function getAthleteSnapshot() {
  const supabase = getSupabaseClient()

  // Try the view first, fall back to manual query
  try {
    const { data, error } = await supabase
      .from('v_athlete_snapshot')
      .select('*')
      .eq('athlete_id', ATHLETE_ID)
      .single()

    if (!error && data) return { success: true, data, source: 'v_athlete_snapshot' }
  } catch (e) {
    // View might not exist, fall back
  }

  // Fallback: query athletes table directly
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', ATHLETE_ID)
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

// Training load analysis
async function getTrainingLoadAnalysis(dateRange) {
  const supabase = getSupabaseClient()
  const { start, end } = getDateRange(dateRange || 'last_30_days')

  const { data, error } = await supabase
    .from('training_load')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: 'No training load data found' }

  const latest = data[0]
  const totalTss = data.reduce((s, d) => s + (d.daily_tss || 0), 0)

  let formStatus = 'unknown'
  if (latest.tsb !== null) {
    if (latest.tsb >= 15) formStatus = 'very fresh (race ready)'
    else if (latest.tsb >= 5) formStatus = 'fresh (good for hard efforts)'
    else if (latest.tsb >= -10) formStatus = 'neutral (balanced)'
    else if (latest.tsb >= -25) formStatus = 'tired (building fitness)'
    else formStatus = 'very fatigued (need recovery)'
  }

  return {
    success: true,
    data: {
      current_ctl: latest.ctl,
      current_atl: latest.atl,
      current_tsb: latest.tsb,
      form_status: formStatus,
      ramp_rate: latest.ramp_rate,
      total_tss: Math.round(totalTss),
      avg_daily_tss: Math.round(totalTss / data.length),
      training_days: data.filter(d => d.daily_tss > 0).length,
      rest_days: data.filter(d => !d.daily_tss || d.daily_tss === 0).length,
      period_days: data.length
    }
  }
}

// Performance profile (7-axis)
async function getPerformanceProfile() {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('performance_profile')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: 'No performance profile data' }

  const profile = {}
  const strengths = []
  const weaknesses = []

  data.forEach(row => {
    profile[row.axis] = { score: row.score, value: row.absolute_value, unit: row.unit }
    if (row.score >= 75) strengths.push(`${row.axis} (${row.score}th percentile)`)
    if (row.score <= 40) weaknesses.push(`${row.axis} (${row.score}th percentile)`)
  })

  return { success: true, data: { profile, strengths, weaknesses } }
}

// Activity summary
async function getActivitySummary(dateRange) {
  const supabase = getSupabaseClient()
  const { start, end } = getDateRange(dateRange || 'last_30_days')

  const { data, error } = await supabase
    .from('activities')
    .select('id, name, activity_type, started_at, duration_seconds, moving_time_seconds, distance_m, elevation_gain_m, avg_power, normalized_power, tss, avg_hr, max_hr, calories, is_race, is_indoor')
    .eq('athlete_id', ATHLETE_ID)
    .gte('started_at', start)
    .lte('started_at', end + 'T23:59:59')
    .order('started_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) return { success: false, error: 'No activities found' }

  const totalDistance = data.reduce((s, a) => s + (a.distance_m || 0), 0)
  const totalElevation = data.reduce((s, a) => s + (a.elevation_gain_m || 0), 0)
  const totalDuration = data.reduce((s, a) => s + (a.duration_seconds || 0), 0)
  const totalTss = data.reduce((s, a) => s + (a.tss || 0), 0)

  return {
    success: true,
    data: {
      total_activities: data.length,
      total_distance_km: Math.round(totalDistance / 100) / 10,
      total_elevation_m: Math.round(totalElevation),
      total_hours: Math.round(totalDuration / 360) / 10,
      total_tss: Math.round(totalTss),
      activities: data.map(a => ({
        ...a,
        distance_km: a.distance_m ? Math.round(a.distance_m / 100) / 10 : null,
        duration_hours: a.duration_seconds ? Math.round(a.duration_seconds / 360) / 10 : null
      }))
    }
  }
}

const DATA_ANALYST_SYSTEM_PROMPT = `You are Lucy's Data Analysis Agent — a specialized AI for exploring, querying, and analyzing cycling and endurance sports data.

## YOUR ROLE
You are NOT the coaching chatbot. You are the DATA ANALYST. Your job is to:
- Query and explore the athlete's database
- Find patterns, trends, and anomalies in the data
- Provide statistical summaries and comparisons
- Answer data-driven questions with precision
- Present data clearly using tables, lists, and structured formats

## PERSONALITY
- Analytical and precise
- Data-first: always back claims with numbers
- Proactive: suggest follow-up analyses when you spot interesting patterns
- Clear: present complex data in digestible formats

## AVAILABLE TOOLS

### 1. query_table (Raw Data Access)
Query any table directly. Available tables in the new schema:

**Core:** athletes, device_connections
**Daily Tracking:** daily_biometrics, sleep_data, daily_nutrition, daily_logs
**Training:** activities, activity_streams, training_load, planned_workouts
**Performance:** power_duration_curve, performance_profile, signature_metrics, metabolic_profiles, durability_metrics
**Calendar:** calendar_events
**Equipment:** equipment, expenses, travel_logistics
**Management:** training_focus, training_summaries
**Food:** food_items
**Intelligence:** athlete_insights, athlete_knowledge

### 2. get_athlete_snapshot
Quick overview of the athlete: profile, current metrics, latest biometrics, training load, and next race. Use this first to understand context.

### 3. get_training_load_analysis
Detailed PMC analysis: CTL, ATL, TSB, form status, ramp rate, training/rest day counts.

### 4. get_performance_profile
7-axis performance profile: neuromuscular, w_prime, glycolytic, vo2max, threshold, endurance, durability. Shows strengths and weaknesses.

### 5. get_activity_summary
Aggregate activity data with totals (distance, elevation, hours, TSS) plus individual activity list.

## DATE RANGES
Available: today, yesterday, last_7_days, last_14_days, last_30_days, last_90_days, this_week, last_week, this_month, last_month

## RESPONSE FORMAT
Use rich markdown:
- **Tables** for multi-column data comparisons
- **Bold** for key metrics and values
- **Headers** (##, ###) for sections
- **Lists** for findings and recommendations
- **Code blocks** for raw data or calculations
- Always include units: **285W**, **72.5kg**, **6.5 hours**

## KEY SCHEMA NOTES (Lucy Architecture v2.1)
- athletes table has generated column: ftp_wkg = ftp_watts / weight_kg
- training_load: ctl, atl, tsb, ramp_rate, daily_tss, daily_if
- activities: comprehensive with power zones, HR zones as JSONB
- sleep_data: stages (rem, deep, light), efficiency, score
- daily_logs: self-reported readiness, energy, motivation, stress, mood, soreness, legs_feeling
- training_summaries: period_type ('week' or 'month'), unified table
- calendar_events: unified (races + life events), event_type discriminator
- performance_profile: 7 axis rows per athlete (neuromuscular, w_prime, glycolytic, vo2max, threshold, endurance, durability)

## RULES
1. Always query data before answering — never guess numbers.
2. When presenting trends, show the direction and magnitude of change.
3. Flag anomalies or concerning patterns.
4. Suggest follow-up queries when you find something interesting.
5. DO NOT use emojis. Keep it clean and professional.`

const TOOLS = [
  {
    name: 'query_table',
    description: 'Query any database table directly for raw data. Use for exploring specific data points, daily tracking, activities, equipment, etc.',
    input_schema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Table to query. Options: athletes, device_connections, daily_biometrics, sleep_data, daily_nutrition, daily_logs, activities, activity_streams, training_load, planned_workouts, power_duration_curve, performance_profile, signature_metrics, metabolic_profiles, durability_metrics, calendar_events, equipment, expenses, travel_logistics, training_focus, training_summaries, food_items, athlete_insights, athlete_knowledge'
        },
        date_range: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7_days', 'last_14_days', 'last_30_days', 'last_90_days', 'this_week', 'last_week', 'this_month', 'last_month'],
          description: 'Date filter. Omit for non-date tables like athletes, equipment, performance_profile.'
        },
        limit: {
          type: 'number',
          description: 'Max records to return. Default 50.'
        },
        columns: {
          type: 'string',
          description: 'Comma-separated column names to select. Default is all columns (*).'
        }
      },
      required: ['table_name']
    }
  },
  {
    name: 'get_athlete_snapshot',
    description: 'Get a quick overview of the athlete: profile, current FTP, weight, rider type, latest biometrics, training load status, and upcoming races. Good starting point for any analysis.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_training_load_analysis',
    description: 'Get detailed PMC (Performance Management Chart) analysis: CTL (fitness), ATL (fatigue), TSB (form), ramp rate, training vs rest days, total TSS.',
    input_schema: {
      type: 'object',
      properties: {
        date_range: {
          type: 'string',
          enum: ['last_7_days', 'last_14_days', 'last_30_days', 'last_90_days', 'this_week', 'last_week', 'this_month', 'last_month'],
          description: 'Analysis period. Default: last_30_days'
        }
      },
      required: []
    }
  },
  {
    name: 'get_performance_profile',
    description: 'Get the 7-axis performance profile (neuromuscular, w_prime, glycolytic, vo2max, threshold, endurance, durability) with percentile scores, strengths, and weaknesses.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_activity_summary',
    description: 'Get aggregate activity statistics (total distance, elevation, hours, TSS) plus list of individual activities for a period.',
    input_schema: {
      type: 'object',
      properties: {
        date_range: {
          type: 'string',
          enum: ['last_7_days', 'last_14_days', 'last_30_days', 'last_90_days', 'this_week', 'last_week', 'this_month', 'last_month'],
          description: 'Period to summarize. Default: last_30_days'
        }
      },
      required: []
    }
  }
]

async function executeTool(toolName, input) {
  switch (toolName) {
    case 'query_table':
      return await queryTable(input.table_name, {
        dateRange: input.date_range,
        limit: input.limit || 50,
        columns: input.columns
      })
    case 'get_athlete_snapshot':
      return await getAthleteSnapshot()
    case 'get_training_load_analysis':
      return await getTrainingLoadAnalysis(input.date_range)
    case 'get_performance_profile':
      return await getPerformanceProfile()
    case 'get_activity_summary':
      return await getActivitySummary(input.date_range)
    default:
      return { success: false, error: `Unknown tool: ${toolName}` }
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { message, history = [] } = JSON.parse(event.body)

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }
    }

    const anthropic = new Anthropic({ apiKey })

    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
    messages.push({ role: 'user', content: message })

    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: DATA_ANALYST_SYSTEM_PROMPT,
      messages,
      tools: TOOLS
    })

    // Tool execution loop
    let iterations = 0
    const MAX_ITERATIONS = 10

    while (response.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
      iterations++

      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use')
      if (toolUseBlocks.length === 0) break

      // Add assistant response to messages
      messages.push({ role: 'assistant', content: response.content })

      // Execute all tool calls and collect results
      const toolResults = []
      for (const toolBlock of toolUseBlocks) {
        console.log(`[data-chat] Tool: ${toolBlock.name}`, toolBlock.input)
        const result = await executeTool(toolBlock.name, toolBlock.input)
        console.log(`[data-chat] Result: ${result.success ? 'OK' : 'FAIL'} (${result.table || toolBlock.name})`)

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: JSON.stringify(result)
        })
      }

      messages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: DATA_ANALYST_SYSTEM_PROMPT,
        messages,
        tools: TOOLS
      })
    }

    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: assistantMessage,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('[data-chat] Error:', error)

    if (error.status === 401) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Invalid API key' }) }
    }
    if (error.status === 429) {
      return { statusCode: 429, body: JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }) }
    }

    return { statusCode: 500, body: JSON.stringify({ error: 'An error occurred processing your request.' }) }
  }
}
