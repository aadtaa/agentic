// Lucy Data Agent — Query Function Registry
// Each function maps to a Supabase query. Parameters are validated.
// No raw SQL reaches the database.

import { createClient } from '@supabase/supabase-js'

const ATHLETE_ID = '00000000-0000-0000-0000-000000000001'

// ─────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase credentials not configured')
  return createClient(url, key)
}

export function createAthleteContext(athleteId) {
  return {
    athlete_id: athleteId || ATHLETE_ID,
    supabase: getSupabaseClient()
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ─────────────────────────────────────────────
// QUERY FUNCTION REGISTRY
// ─────────────────────────────────────────────

export const queryFunctions = {

  get_athlete_profile: {
    id: 'get_athlete_profile',
    description: 'Core athlete profile with current metrics, zones, preferences',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      // Try the snapshot view first, fall back to athletes table
      try {
        const { data, error } = await ctx.supabase
          .from('v_athlete_snapshot')
          .select('*')
          .eq('athlete_id', ctx.athlete_id)
          .single()
        if (!error && data) return data
      } catch (e) { /* view may not exist */ }

      // Fallback: query athletes table directly
      const { data, error } = await ctx.supabase
        .from('athletes')
        .select('*')
        .eq('id', ctx.athlete_id)
        .single()

      if (error) return { _error: true, message: error.message }
      return data
    }
  },

  get_daily_wellness: {
    id: 'get_daily_wellness',
    description: 'Daily biometrics, sleep, and self-reported logs for a date range',
    timeout_ms: 3000,
    handler: async (params, ctx) => {
      const days = params.days || 7
      const startDate = params.date || daysAgo(days)

      const [biometrics, sleep, logs] = await Promise.all([
        ctx.supabase
          .from('daily_biometrics')
          .select('*')
          .eq('athlete_id', ctx.athlete_id)
          .gte('date', startDate)
          .order('date', { ascending: false }),
        ctx.supabase
          .from('sleep_data')
          .select('*')
          .eq('athlete_id', ctx.athlete_id)
          .gte('date', startDate)
          .order('date', { ascending: false }),
        ctx.supabase
          .from('daily_logs')
          .select('*')
          .eq('athlete_id', ctx.athlete_id)
          .gte('date', startDate)
          .order('date', { ascending: false })
      ])

      return {
        biometrics: biometrics.data || [],
        sleep: sleep.data || [],
        logs: logs.data || []
      }
    }
  },

  get_training_load: {
    id: 'get_training_load',
    description: 'PMC data: CTL, ATL, TSB, ramp rate over date range',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      const days = params.days || 30
      const startDate = daysAgo(days)

      const { data, error } = await ctx.supabase
        .from('training_load')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .gte('date', startDate)
        .order('date', { ascending: true })

      if (error) return { _error: true, message: error.message }
      if (!data || data.length === 0) return { _error: true, message: 'No training load data found' }

      const latest = data[data.length - 1]
      const weekAgoDate = daysAgo(7)
      const weekAgo = data.find(d => d.date <= weekAgoDate)

      return {
        current: latest,
        history: data,
        seven_day_delta: latest && weekAgo ? {
          ctl_change: +(latest.ctl - weekAgo.ctl).toFixed(1),
          atl_change: +(latest.atl - weekAgo.atl).toFixed(1),
          tsb_change: +(latest.tsb - weekAgo.tsb).toFixed(1)
        } : null
      }
    }
  },

  get_recent_activities: {
    id: 'get_recent_activities',
    description: 'List of recent activities with summaries (no streams)',
    timeout_ms: 3000,
    handler: async (params, ctx) => {
      const days = params.days || 14
      const startDate = new Date(Date.now() - days * 86400000).toISOString()

      let query = ctx.supabase
        .from('activities')
        .select(`
          id, name, activity_type, started_at,
          duration_seconds, moving_time_seconds,
          distance_m, elevation_gain_m,
          avg_power, normalized_power, max_power,
          intensity_factor, tss,
          avg_hr, max_hr, avg_cadence,
          calories, is_race, is_indoor, tags
        `)
        .eq('athlete_id', ctx.athlete_id)
        .gte('started_at', startDate)
        .order('started_at', { ascending: false })
        .limit(params.limit || 10)

      if (params.activity_type) {
        query = query.eq('activity_type', params.activity_type)
      }

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_activity_detail: {
    id: 'get_activity_detail',
    description: 'Full activity details. Does NOT include streams.',
    timeout_ms: 3000,
    handler: async (params, ctx) => {
      let query = ctx.supabase
        .from('activities')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)

      if (params.activity_id) {
        query = query.eq('id', params.activity_id).single()
      } else if (params.date) {
        query = query
          .gte('started_at', params.date + 'T00:00:00')
          .lt('started_at', params.date + 'T23:59:59')
        if (params.name_contains) {
          query = query.ilike('name', `%${params.name_contains}%`)
        }
        query = query.limit(1).single()
      } else {
        return { _error: true, message: 'activity_id or date is required' }
      }

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data
    }
  },

  get_activity_streams: {
    id: 'get_activity_streams',
    description: 'Second-by-second time series. EXPENSIVE.',
    timeout_ms: 5000,
    handler: async (params, ctx) => {
      if (!params.activity_id) {
        return { _error: true, message: 'activity_id is required' }
      }

      const { data, error } = await ctx.supabase
        .from('activity_streams')
        .select('*')
        .eq('activity_id', params.activity_id)
        .single()

      if (error) return { _error: true, message: error.message }
      return data
    }
  },

  get_calendar: {
    id: 'get_calendar',
    description: 'Calendar events: races, training events, life events',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      const now = new Date()
      const from = daysAgo(params.days_back || 0)
      const to = new Date(now.getTime() + (params.days_ahead || 30) * 86400000)
        .toISOString().split('T')[0]

      let query = ctx.supabase
        .from('calendar_events')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })

      if (params.event_type) query = query.eq('event_type', params.event_type)
      if (params.priority) query = query.eq('priority', params.priority)

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }

      // Add days_until for each event
      const todayDate = new Date()
      return (data || []).map(e => ({
        ...e,
        days_until: Math.ceil((new Date(e.date) - todayDate) / 86400000)
      }))
    }
  },

  get_nutrition: {
    id: 'get_nutrition',
    description: 'Daily nutrition data: macros, workout fueling, targets',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      const days = params.days || 7
      const startDate = daysAgo(days)

      const { data, error } = await ctx.supabase
        .from('daily_nutrition')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .gte('date', startDate)
        .order('date', { ascending: false })

      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_power_profile: {
    id: 'get_power_profile',
    description: 'Power duration curve and seven-axis performance profile',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      const [curve, axes] = await Promise.all([
        ctx.supabase
          .from('power_duration_curve')
          .select('*')
          .eq('athlete_id', ctx.athlete_id)
          .order('duration_seconds', { ascending: true }),
        ctx.supabase
          .from('performance_profile')
          .select('*')
          .eq('athlete_id', ctx.athlete_id)
      ])

      return {
        power_curve: curve.data || [],
        performance_axes: axes.data || []
      }
    }
  },

  get_signature_history: {
    id: 'get_signature_history',
    description: 'Historical FTP, CP, weight, VO2max tests over time',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      let query = ctx.supabase
        .from('signature_metrics')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .order('tested_at', { ascending: false })
        .limit(params.limit || 20)

      if (params.metric_type) query = query.eq('metric_type', params.metric_type)

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_metabolic_profile: {
    id: 'get_metabolic_profile',
    description: 'Metabolic testing results: VLamax, fat oxidation, fractional utilization',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      const { data, error } = await ctx.supabase
        .from('metabolic_profiles')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .order('tested_at', { ascending: false })
        .limit(5)

      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_durability_metrics: {
    id: 'get_durability_metrics',
    description: 'Power retention and fatigue resistance on long efforts',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      const { data, error } = await ctx.supabase
        .from('durability_metrics')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .order('measured_at', { ascending: false })
        .limit(params.limit || 10)

      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_equipment: {
    id: 'get_equipment',
    description: 'Bikes, trainers, power meters with usage and service tracking',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      let query = ctx.supabase
        .from('equipment')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)

      if (params.active_only !== false) query = query.eq('status', 'active')
      if (params.equipment_type) query = query.eq('equipment_type', params.equipment_type)

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_training_focus: {
    id: 'get_training_focus',
    description: 'Current and historical training priorities with targets and progress',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      let query = ctx.supabase
        .from('training_focus')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .order('priority', { ascending: true })

      if (params.active_only !== false) query = query.eq('status', 'active')

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_training_summaries: {
    id: 'get_training_summaries',
    description: 'Weekly or monthly training aggregates with compliance and wellness',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      const { data, error } = await ctx.supabase
        .from('training_summaries')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .eq('period_type', params.period_type || 'week')
        .order('period_start', { ascending: false })
        .limit(params.limit || 8)

      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_athlete_knowledge: {
    id: 'get_athlete_knowledge',
    description: 'Cross-conversation memory: tendencies, injuries, psychological patterns',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      let query = ctx.supabase
        .from('athlete_knowledge')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .eq('is_active', true)

      if (params.category) query = query.eq('category', params.category)

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_insights: {
    id: 'get_insights',
    description: 'Lucy-generated insights: strengths, weaknesses, patterns, recommendations',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      let query = ctx.supabase
        .from('athlete_insights')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .order('priority', { ascending: true })

      if (params.active_only !== false) query = query.eq('status', 'active')
      if (params.category) query = query.eq('category', params.category)

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_expenses: {
    id: 'get_expenses',
    description: 'Expense tracking: equipment, race entries, nutrition, travel costs',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      const startDate = daysAgo(params.days || 90)

      let query = ctx.supabase
        .from('expenses')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)
        .gte('date', startDate)
        .order('date', { ascending: false })

      if (params.category) query = query.eq('category', params.category)

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data || []
    }
  },

  get_travel_logistics: {
    id: 'get_travel_logistics',
    description: 'Travel plans for races: flights, accommodation, bike transport',
    timeout_ms: 2000,
    handler: async (params, ctx) => {
      let query = ctx.supabase
        .from('travel_logistics')
        .select('*')
        .eq('athlete_id', ctx.athlete_id)

      if (params.event_id) query = query.eq('calendar_event_id', params.event_id)

      const { data, error } = await query
      if (error) return { _error: true, message: error.message }
      return data || []
    }
  }
}

// ─────────────────────────────────────────────
// EXECUTOR: Parallel execution with timeouts
// ─────────────────────────────────────────────

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  )
}

function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const group = item[key] ?? 0
    if (!groups[group]) groups[group] = []
    groups[group].push(item)
    return groups
  }, {})
}

/**
 * Execute a plan of function calls with parallel group support.
 * Returns { results, errors }
 */
export async function executePlan(plan, ctx) {
  const results = {}
  const errors = {}

  // Group by parallel_group
  const groups = groupBy(plan, 'parallel_group')
  const sortedGroupIds = Object.keys(groups).sort((a, b) => a - b)

  for (const groupId of sortedGroupIds) {
    const calls = groups[groupId]

    const groupResults = await Promise.allSettled(
      calls.map(async (call) => {
        const fn = queryFunctions[call.function_id]
        if (!fn) {
          throw Object.assign(
            new Error(`Unknown function: ${call.function_id}`),
            { functionId: call.function_id }
          )
        }

        const result = await Promise.race([
          fn.handler(call.params || {}, ctx),
          timeoutPromise(fn.timeout_ms)
        ])

        return { id: call.function_id, data: result }
      })
    )

    for (const result of groupResults) {
      if (result.status === 'fulfilled') {
        const { id, data } = result.value
        // Check if the function returned an error object
        if (data && data._error) {
          errors[id] = data.message
        } else {
          results[id] = data
        }
      } else {
        // Promise rejected (timeout or throw)
        const reason = result.reason
        const fnId = reason?.functionId || 'unknown'
        errors[fnId] = reason?.message || 'Unknown error'
      }
    }
  }

  return { results, errors }
}

/**
 * Execute additional queries requested by the Inspector.
 * Max 3 queries, all in parallel.
 */
export async function executeAdditionalQueries(additionalQueries, ctx) {
  const queries = (additionalQueries || []).slice(0, 3)
  if (queries.length === 0) return { results: {}, errors: {} }

  const results = {}
  const errors = {}

  const queryResults = await Promise.allSettled(
    queries.map(async (call) => {
      const fn = queryFunctions[call.function_id]
      if (!fn) {
        throw Object.assign(
          new Error(`Unknown function: ${call.function_id}`),
          { functionId: call.function_id }
        )
      }

      const result = await Promise.race([
        fn.handler(call.params || {}, ctx),
        timeoutPromise(fn.timeout_ms)
      ])

      // Use a suffixed key so it doesn't overwrite initial results
      return { id: call.function_id + '_additional', data: result }
    })
  )

  for (const result of queryResults) {
    if (result.status === 'fulfilled') {
      const { id, data } = result.value
      if (data && data._error) {
        errors[id] = data.message
      } else {
        results[id] = data
      }
    } else {
      const reason = result.reason
      const fnId = (reason?.functionId || 'unknown') + '_additional'
      errors[fnId] = reason?.message || 'Unknown error'
    }
  }

  return { results, errors }
}
