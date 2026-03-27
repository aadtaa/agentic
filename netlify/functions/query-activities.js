// ─────────────────────────────────────────────────────────────
// QUERY-ACTIVITIES — Cross-activity queries against stored timeseries
//
// This is what makes multi-activity analysis fast:
// instead of loading all rides into memory, we query pre-indexed
// Postgres tables (activity_points, activity_segments, activity_best_efforts).
//
// Query types:
//   best_efforts  — "Best 5min power ever", "Best 20min power on climbs"
//   climbs        — "All climbs over 5%", "Steepest climbs ranked by power"
//   segments      — "Compare 5min segments across rides"
//   power_curve   — "All-time power duration curve from best efforts"
//   gradient_power — "How does my power change with gradient?"
//   raw_query     — Custom SQL-like query against points
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ATHLETE_ID = '00000000-0000-0000-0000-000000000001'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, body: '' }
  }

  try {
    const body = JSON.parse(event.body)
    const { query_type, params } = body

    let result
    switch (query_type) {
      case 'best_efforts':
        result = await queryBestEfforts(params || {})
        break
      case 'climbs':
        result = await queryClimbs(params || {})
        break
      case 'segments':
        result = await querySegments(params || {})
        break
      case 'power_curve':
        result = await queryPowerCurve(params || {})
        break
      case 'gradient_power':
        result = await queryGradientPower(params || {})
        break
      case 'activity_compare':
        result = await queryActivityCompare(params || {})
        break
      default:
        return respond(400, { error: 'Unknown query_type: ' + query_type })
    }

    return respond(200, { success: true, query_type, ...result })
  } catch (err) {
    console.error('[query-activities] Error:', err)
    return respond(500, { error: err.message })
  }
}

// ── BEST EFFORTS ─────────────────────────────────────────────
// "Best 5min power ever"
// "Best 5min power on climbs over 5%"
// "Top 10 best 1min efforts"

async function queryBestEfforts(params) {
  const duration = params.duration_seconds || 300 // default 5min
  const minGradient = params.min_gradient || null
  const limit = params.limit || 10
  const dateFrom = params.date_from || null
  const dateTo = params.date_to || null

  let query = supabase
    .from('activity_best_efforts')
    .select(`
      watts, watts_per_kg, duration_seconds,
      start_seconds, end_seconds,
      avg_hr, avg_cadence, avg_gradient, avg_altitude,
      activity_id,
      tcx_files!inner(title, activity_date, distance_meters, elevation_meters)
    `)
    .eq('athlete_id', ATHLETE_ID)
    .eq('duration_seconds', duration)
    .order('watts', { ascending: false })
    .limit(limit)

  if (minGradient != null) {
    query = query.gte('avg_gradient', minGradient)
  }
  if (dateFrom) {
    query = query.gte('tcx_files.activity_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('tcx_files.activity_date', dateTo)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    data,
    description: `Top ${limit} best ${formatDur(duration)} efforts` +
      (minGradient ? ` on gradient >= ${minGradient}%` : '') +
      (dateFrom ? ` from ${dateFrom}` : '')
  }
}

// ── CLIMBS ───────────────────────────────────────────────────
// "All climbs over 5% gradient"
// "Climbs ranked by VAM"
// "Longest climbs"

async function queryClimbs(params) {
  const minGradient = params.min_gradient || 3
  const minGain = params.min_gain || 50
  const orderBy = params.order_by || 'vam' // 'vam', 'elevation_gain', 'avg_power', 'duration_seconds'
  const limit = params.limit || 20
  const dateFrom = params.date_from || null

  let query = supabase
    .from('activity_segments')
    .select(`
      *,
      tcx_files!inner(title, activity_date)
    `)
    .eq('athlete_id', ATHLETE_ID)
    .eq('segment_type', 'climb')
    .gte('avg_gradient', minGradient)
    .gte('elevation_gain', minGain)
    .order(orderBy, { ascending: false })
    .limit(limit)

  if (dateFrom) {
    query = query.gte('tcx_files.activity_date', dateFrom)
  }

  const { data, error } = await query
  if (error) throw error

  return {
    data,
    description: `Top ${limit} climbs (>= ${minGradient}%, >= ${minGain}m gain) by ${orderBy}`
  }
}

// ── SEGMENTS ─────────────────────────────────────────────────
// "Compare 5min segments across rides"
// "Hardest 5min blocks ever"

async function querySegments(params) {
  const segmentType = params.segment_type || '300s'
  const orderBy = params.order_by || 'normalized_power'
  const limit = params.limit || 20

  let query = supabase
    .from('activity_segments')
    .select(`
      *,
      tcx_files!inner(title, activity_date)
    `)
    .eq('athlete_id', ATHLETE_ID)
    .eq('segment_type', segmentType)
    .not(orderBy, 'is', null)
    .order(orderBy, { ascending: false })
    .limit(limit)

  const { data, error } = await query
  if (error) throw error

  return {
    data,
    description: `Top ${limit} ${segmentType} segments by ${orderBy}`
  }
}

// ── POWER DURATION CURVE (all-time) ──────────────────────────
// Uses best efforts to build the curve instantly

async function queryPowerCurve(params) {
  const dateFrom = params.date_from || null
  const dateTo = params.date_to || null

  let query = supabase
    .from('activity_best_efforts')
    .select('duration_seconds, watts, watts_per_kg, activity_id, tcx_files!inner(activity_date)')
    .eq('athlete_id', ATHLETE_ID)

  if (dateFrom) {
    query = query.gte('tcx_files.activity_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('tcx_files.activity_date', dateTo)
  }

  const { data, error } = await query
  if (error) throw error

  // Group by duration, take max watts
  const byDuration = {}
  for (const row of data) {
    const d = row.duration_seconds
    if (!byDuration[d] || row.watts > byDuration[d].watts) {
      byDuration[d] = row
    }
  }

  const curve = Object.values(byDuration)
    .sort((a, b) => a.duration_seconds - b.duration_seconds)
    .map(r => ({
      duration_seconds: r.duration_seconds,
      duration_label: formatDur(r.duration_seconds),
      watts: r.watts,
      watts_per_kg: r.watts_per_kg,
      from_date: r.tcx_files?.activity_date
    }))

  return {
    data: curve,
    description: 'All-time power duration curve' +
      (dateFrom ? ` from ${dateFrom}` : '') +
      (dateTo ? ` to ${dateTo}` : '')
  }
}

// ── GRADIENT vs POWER ────────────────────────────────────────
// "How does my power change with gradient?"
// Queries activity_points directly — groups by gradient buckets

async function queryGradientPower(params) {
  const bucketSize = params.bucket_size || 2 // 2% gradient buckets
  const minSeconds = params.min_seconds || 60 // minimum time in bucket

  // Use segments instead of raw points (much faster)
  const { data, error } = await supabase
    .from('activity_segments')
    .select('avg_gradient, avg_power, avg_hr, avg_cadence, avg_speed, duration_seconds')
    .eq('athlete_id', ATHLETE_ID)
    .eq('segment_type', '60s')
    .not('avg_gradient', 'is', null)
    .not('avg_power', 'is', null)

  if (error) throw error

  // Bucket by gradient
  const buckets = {}
  for (const seg of data) {
    const g = Math.floor(seg.avg_gradient / bucketSize) * bucketSize
    if (!buckets[g]) {
      buckets[g] = { gradient: g, total_power: 0, total_hr: 0, total_cadence: 0, total_speed: 0, total_duration: 0, count: 0 }
    }
    const b = buckets[g]
    b.total_power += seg.avg_power * seg.duration_seconds
    b.total_hr += (seg.avg_hr || 0) * seg.duration_seconds
    b.total_cadence += (seg.avg_cadence || 0) * seg.duration_seconds
    b.total_speed += (seg.avg_speed || 0) * seg.duration_seconds
    b.total_duration += seg.duration_seconds
    b.count++
  }

  const result = Object.values(buckets)
    .filter(b => b.total_duration >= minSeconds)
    .map(b => ({
      gradient_bucket: b.gradient + '% to ' + (b.gradient + bucketSize) + '%',
      gradient_min: b.gradient,
      gradient_max: b.gradient + bucketSize,
      avg_power: Math.round(b.total_power / b.total_duration),
      avg_hr: Math.round(b.total_hr / b.total_duration),
      avg_cadence: Math.round(b.total_cadence / b.total_duration),
      avg_speed: Math.round(b.total_speed / b.total_duration * 10) / 10,
      total_time_seconds: Math.round(b.total_duration),
      total_time_formatted: formatDur(b.total_duration),
      segment_count: b.count
    }))
    .sort((a, b) => a.gradient_min - b.gradient_min)

  return {
    data: result,
    description: `Power by gradient (${bucketSize}% buckets, min ${minSeconds}s)`
  }
}

// ── ACTIVITY COMPARISON ──────────────────────────────────────
// Compare segments between two or more activities

async function queryActivityCompare(params) {
  const activityIds = params.activity_ids || []
  const segmentType = params.segment_type || '300s'

  if (!activityIds.length) {
    // Default: last 5 activities
    const { data: recent } = await supabase
      .from('tcx_files')
      .select('id, title, activity_date')
      .eq('athlete_id', ATHLETE_ID)
      .order('activity_date', { ascending: false })
      .limit(5)
    if (recent) activityIds.push(...recent.map(r => r.id))
  }

  const { data, error } = await supabase
    .from('activity_segments')
    .select(`
      *,
      tcx_files!inner(title, activity_date)
    `)
    .in('activity_id', activityIds)
    .eq('segment_type', segmentType)
    .order('segment_index', { ascending: true })

  if (error) throw error

  // Group by activity
  const byActivity = {}
  for (const seg of data) {
    const id = seg.activity_id
    if (!byActivity[id]) {
      byActivity[id] = {
        activity_id: id,
        title: seg.tcx_files?.title,
        date: seg.tcx_files?.activity_date,
        segments: []
      }
    }
    byActivity[id].segments.push(seg)
  }

  return {
    data: Object.values(byActivity),
    description: `Comparing ${activityIds.length} activities by ${segmentType} segments`
  }
}

// ── HELPERS ──────────────────────────────────────────────────

function respond(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}

function formatDur(seconds) {
  var h = Math.floor(seconds / 3600)
  var m = Math.floor((seconds % 3600) / 60)
  var s = Math.round(seconds % 60)
  if (h > 0) return h + 'h ' + (m < 10 ? '0' : '') + m + 'm'
  if (m > 0) return m + 'm ' + (s < 10 ? '0' : '') + s + 's'
  return s + 's'
}
