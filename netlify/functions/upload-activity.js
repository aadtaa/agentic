// ─────────────────────────────────────────────────────────────
// UPLOAD-ACTIVITY — Process and persist a cycling activity
//
// Flow:
// 1. Receive parsed points (client already parsed FIT/TCX/GPX)
// 2. Store in tcx_files (metadata)
// 3. Store in activity_points (raw timeseries)
// 4. Compute and store activity_segments (60s, 300s, climbs, intervals)
// 5. Compute and store activity_best_efforts (power duration curve)
//
// Why client parses, server stores:
//   - FIT is binary, hard to parse server-side without native libs
//   - Client already has the parsers
//   - Server handles persistence + precomputation
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
    const { filename, points, metadata } = body

    if (!points || !points.length) {
      return respond(400, { error: 'No points provided' })
    }

    console.log(`[upload-activity] Processing ${filename}: ${points.length} points`)

    // ── 1. Create tcx_files record ───────────────────────

    const meta = metadata || {}
    const duration = points[points.length - 1].elapsed_seconds - points[0].elapsed_seconds
    const distance = (points[points.length - 1].distance_meters || 0) - (points[0].distance_meters || 0)

    // Compute summary metrics
    const summary = computeSummary(points, meta.ftp || 250)

    const { data: activityRecord, error: activityError } = await supabase
      .from('tcx_files')
      .insert({
        athlete_id: ATHLETE_ID,
        filename: filename,
        file_path: 'uploads/' + filename,
        file_hash: hashPoints(points),
        activity_date: meta.date || new Date().toISOString().split('T')[0],
        activity_type: meta.activity_type || 'ride',
        workout_type: meta.workout_type || null,
        title: meta.title || filename.replace(/\.(fit|tcx|gpx)$/i, ''),
        duration_seconds: Math.round(duration),
        moving_time_seconds: Math.round(summary.moving_time),
        distance_meters: Math.round(distance),
        elevation_meters: Math.round(summary.elevation_gain),
        avg_power: summary.avg_power,
        max_power: summary.max_power,
        normalized_power: summary.normalized_power,
        intensity_factor: meta.ftp ? parseFloat((summary.normalized_power / meta.ftp).toFixed(3)) : null,
        tss: summary.tss,
        avg_hr: summary.avg_hr,
        max_hr: summary.max_hr,
        avg_cadence: summary.avg_cadence,
        indoor: meta.indoor || false,
        device: meta.device || null,
        processed: true
      })
      .select('id')
      .single()

    if (activityError) {
      // If duplicate hash, return existing
      if (activityError.code === '23505') {
        return respond(409, { error: 'Activity already uploaded (duplicate hash)' })
      }
      throw activityError
    }

    const activityId = activityRecord.id
    console.log(`[upload-activity] Created activity ${activityId}`)

    // ── 2. Store raw points ──────────────────────────────
    // Batch insert in chunks of 1000

    const pointRows = points.map(function (p) {
      var grad = null
      if (p._gradient != null) grad = p._gradient
      return {
        activity_id: activityId,
        athlete_id: ATHLETE_ID,
        elapsed_seconds: p.elapsed_seconds,
        timestamp: p.timestamp || null,
        latitude: p.latitude || null,
        longitude: p.longitude || null,
        altitude: p.altitude || null,
        heart_rate: p.heart_rate || null,
        cadence: p.cadence || null,
        power: p.power || null,
        speed: p.speed || null,
        distance_meters: p.distance_meters || null,
        temperature: p.temperature || null,
        gradient: grad
      }
    })

    // Compute gradient for each point
    for (var i = 1; i < pointRows.length; i++) {
      var dist = (pointRows[i].distance_meters || 0) - (pointRows[i - 1].distance_meters || 0)
      if (dist > 1 && pointRows[i].altitude != null && pointRows[i - 1].altitude != null) {
        pointRows[i].gradient = parseFloat(((pointRows[i].altitude - pointRows[i - 1].altitude) / dist * 100).toFixed(1))
      }
    }

    const BATCH = 1000
    for (var i = 0; i < pointRows.length; i += BATCH) {
      var batch = pointRows.slice(i, i + BATCH)
      var { error: pointsError } = await supabase
        .from('activity_points')
        .insert(batch)
      if (pointsError) {
        console.error('[upload-activity] Points insert error at batch', i, pointsError)
        // Don't fail the whole upload for a batch error
      }
    }

    console.log(`[upload-activity] Stored ${pointRows.length} points`)

    // ── 3. Compute and store segments ────────────────────

    const segments = []

    // 60-second segments
    var segIdx = 0
    for (var t = 0; t < duration; t += 60) {
      var seg = sliceByTime(points, t, Math.min(t + 60, duration))
      if (seg.length < 2) continue
      var s = segmentStats(seg)
      segments.push({
        activity_id: activityId,
        athlete_id: ATHLETE_ID,
        segment_type: '60s',
        segment_index: segIdx++,
        start_seconds: t,
        end_seconds: Math.min(t + 60, duration),
        duration_seconds: Math.min(60, duration - t),
        ...s
      })
    }

    // 300-second segments
    segIdx = 0
    for (var t = 0; t < duration; t += 300) {
      var seg = sliceByTime(points, t, Math.min(t + 300, duration))
      if (seg.length < 2) continue
      var s = segmentStats(seg)
      segments.push({
        activity_id: activityId,
        athlete_id: ATHLETE_ID,
        segment_type: '300s',
        segment_index: segIdx++,
        start_seconds: t,
        end_seconds: Math.min(t + 300, duration),
        duration_seconds: Math.min(300, duration - t),
        ...s
      })
    }

    // 1km segments
    segIdx = 0
    var startDist = points[0].distance_meters || 0
    var startIdx = 0
    for (var i = 1; i < points.length; i++) {
      var d = (points[i].distance_meters || 0) - (points[startIdx].distance_meters || 0)
      if (d >= 1000 || i === points.length - 1) {
        var seg = points.slice(startIdx, i + 1)
        var s = segmentStats(seg)
        segments.push({
          activity_id: activityId,
          athlete_id: ATHLETE_ID,
          segment_type: '1km',
          segment_index: segIdx++,
          start_seconds: seg[0].elapsed_seconds,
          end_seconds: seg[seg.length - 1].elapsed_seconds,
          start_distance: points[startIdx].distance_meters || 0,
          end_distance: points[i].distance_meters || 0,
          duration_seconds: seg[seg.length - 1].elapsed_seconds - seg[0].elapsed_seconds,
          distance_meters: d,
          ...s
        })
        startIdx = i
      }
    }

    // Climb detection
    var climbs = detectClimbsSimple(points)
    for (var c = 0; c < climbs.length; c++) {
      var climb = climbs[c]
      segments.push({
        activity_id: activityId,
        athlete_id: ATHLETE_ID,
        segment_type: 'climb',
        segment_index: c,
        start_seconds: climb.start_seconds,
        end_seconds: climb.end_seconds,
        start_distance: climb.start_distance,
        end_distance: climb.end_distance,
        duration_seconds: climb.duration_seconds,
        distance_meters: climb.distance_meters,
        avg_power: climb.avg_power,
        max_power: climb.max_power,
        normalized_power: climb.normalized_power,
        avg_hr: climb.avg_hr,
        max_hr: climb.max_hr,
        avg_cadence: climb.avg_cadence,
        avg_speed: climb.avg_speed,
        max_speed: null,
        elevation_gain: climb.elevation_gain,
        elevation_loss: 0,
        avg_gradient: climb.avg_gradient,
        max_gradient: climb.max_gradient,
        start_altitude: climb.start_altitude,
        end_altitude: climb.peak_altitude,
        climb_category: climb.category,
        vam: climb.vam
      })
    }

    // Insert segments in batches
    for (var i = 0; i < segments.length; i += BATCH) {
      var batch = segments.slice(i, i + BATCH)
      var { error: segError } = await supabase
        .from('activity_segments')
        .insert(batch)
      if (segError) {
        console.error('[upload-activity] Segment insert error:', segError)
      }
    }

    console.log(`[upload-activity] Stored ${segments.length} segments (${climbs.length} climbs)`)

    // ── 4. Compute and store best efforts ────────────────

    const durations = [1, 5, 15, 30, 60, 120, 300, 600, 1200, 3600]
    const efforts = []
    const powers = points.map(function (p) { return p.power || 0 })

    for (var d = 0; d < durations.length; d++) {
      var dur = durations[d]
      if (dur > duration) break

      var best = bestPower(powers, dur, points)
      if (best.watts > 0) {
        efforts.push({
          activity_id: activityId,
          athlete_id: ATHLETE_ID,
          duration_seconds: dur,
          watts: best.watts,
          watts_per_kg: meta.weight ? parseFloat((best.watts / meta.weight).toFixed(2)) : null,
          start_seconds: best.start_seconds,
          end_seconds: best.start_seconds + dur,
          avg_hr: best.avg_hr,
          avg_cadence: best.avg_cadence,
          avg_gradient: best.avg_gradient,
          avg_altitude: best.avg_altitude
        })
      }
    }

    var { error: effortError } = await supabase
      .from('activity_best_efforts')
      .insert(efforts)
    if (effortError) {
      console.error('[upload-activity] Best efforts insert error:', effortError)
    }

    console.log(`[upload-activity] Stored ${efforts.length} best efforts`)

    // ── 5. Return summary ────────────────────────────────

    return respond(200, {
      success: true,
      activity_id: activityId,
      summary: {
        points_stored: pointRows.length,
        segments_stored: segments.length,
        climbs_found: climbs.length,
        best_efforts: efforts.length,
        duration: formatDur(duration),
        distance_km: (distance / 1000).toFixed(1),
        normalized_power: summary.normalized_power,
        tss: summary.tss
      }
    })

  } catch (err) {
    console.error('[upload-activity] Error:', err)
    return respond(500, { error: err.message })
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

function hashPoints(points) {
  // Simple hash from first/last point + count for deduplication
  var first = points[0]
  var last = points[points.length - 1]
  var str = points.length + ':' +
    (first.elapsed_seconds || 0) + ':' + (first.power || 0) + ':' +
    (last.elapsed_seconds || 0) + ':' + (last.power || 0) + ':' +
    (last.distance_meters || 0)
  // Simple string hash
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return 'pts_' + Math.abs(hash).toString(36) + '_' + points.length
}

function sliceByTime(points, start, end) {
  // Binary search for start
  var lo = 0, hi = points.length
  while (lo < hi) {
    var mid = (lo + hi) >>> 1
    if (points[mid].elapsed_seconds < start) lo = mid + 1
    else hi = mid
  }
  var result = []
  for (var i = lo; i < points.length && points[i].elapsed_seconds <= end; i++) {
    result.push(points[i])
  }
  return result
}

function computeSummary(points, ftp) {
  var powers = [], hrs = [], cads = [], moving = 0
  var maxP = 0, maxH = 0

  for (var i = 0; i < points.length; i++) {
    var p = points[i]
    if (p.power > 0) powers.push(p.power)
    if (p.heart_rate > 0) hrs.push(p.heart_rate)
    if (p.cadence > 0) cads.push(p.cadence)
    if (p.power > maxP) maxP = p.power
    if (p.heart_rate > maxH) maxH = p.heart_rate
    if (i > 0 && (p.speed || 0) > 0.5) {
      var dt = p.elapsed_seconds - points[i - 1].elapsed_seconds
      if (dt < 10) moving += dt
    }
  }

  var avgP = avg(powers)
  var np = computeNP(points)
  var duration = points[points.length - 1].elapsed_seconds - points[0].elapsed_seconds
  var intFactor = ftp ? np / ftp : 0
  var tss = ftp ? Math.round((duration * np * intFactor) / (ftp * 3600) * 100) : 0

  // Elevation
  var gain = 0
  for (var i = 1; i < points.length; i++) {
    if (points[i].altitude != null && points[i - 1].altitude != null) {
      var diff = points[i].altitude - points[i - 1].altitude
      if (diff > 0) gain += diff
    }
  }

  return {
    avg_power: Math.round(avgP),
    max_power: maxP,
    normalized_power: Math.round(np),
    avg_hr: Math.round(avg(hrs)),
    max_hr: maxH,
    avg_cadence: Math.round(avg(cads)),
    tss: tss,
    elevation_gain: gain,
    moving_time: moving
  }
}

function computeNP(points) {
  var powers = points.map(function (p) { return p.power || 0 })
  if (powers.length < 30) return avg(powers)
  // 30s rolling average
  var rolling = []
  var sum = 0
  for (var i = 0; i < powers.length; i++) {
    sum += powers[i]
    if (i >= 30) sum -= powers[i - 30]
    if (i >= 29) rolling.push(sum / 30)
  }
  // 4th power average
  var fourth = 0
  for (var i = 0; i < rolling.length; i++) {
    var v = rolling[i]
    fourth += v * v * v * v
  }
  return Math.pow(fourth / rolling.length, 0.25)
}

function segmentStats(seg) {
  var powers = [], hrs = [], cads = [], speeds = []
  var maxP = 0, maxH = 0, maxS = 0, gain = 0, loss = 0

  for (var i = 0; i < seg.length; i++) {
    if (seg[i].power > 0) powers.push(seg[i].power)
    if (seg[i].heart_rate > 0) hrs.push(seg[i].heart_rate)
    if (seg[i].cadence > 0) cads.push(seg[i].cadence)
    if (seg[i].speed > 0) speeds.push(seg[i].speed * 3.6) // m/s to km/h
    if (seg[i].power > maxP) maxP = seg[i].power
    if (seg[i].heart_rate > maxH) maxH = seg[i].heart_rate
    if (seg[i].speed > maxS) maxS = seg[i].speed
    if (i > 0 && seg[i].altitude != null && seg[i - 1].altitude != null) {
      var diff = seg[i].altitude - seg[i - 1].altitude
      if (diff > 0) gain += diff
      else loss += Math.abs(diff)
    }
  }

  var dist = (seg[seg.length - 1].distance_meters || 0) - (seg[0].distance_meters || 0)
  var altDiff = (seg[seg.length - 1].altitude || 0) - (seg[0].altitude || 0)
  var gradient = dist > 10 ? altDiff / dist * 100 : 0

  return {
    distance_meters: Math.round(dist),
    avg_power: Math.round(avg(powers)) || null,
    max_power: maxP || null,
    normalized_power: seg.length >= 30 ? Math.round(computeNPFromArray(powers)) : null,
    avg_hr: Math.round(avg(hrs)) || null,
    max_hr: maxH || null,
    avg_cadence: Math.round(avg(cads)) || null,
    avg_speed: Math.round(avg(speeds) * 10) / 10 || null,
    max_speed: Math.round(maxS * 3.6 * 10) / 10 || null,
    elevation_gain: Math.round(gain),
    elevation_loss: Math.round(loss),
    avg_gradient: Math.round(gradient * 10) / 10,
    max_gradient: null,
    start_altitude: seg[0].altitude != null ? Math.round(seg[0].altitude) : null,
    end_altitude: seg[seg.length - 1].altitude != null ? Math.round(seg[seg.length - 1].altitude) : null
  }
}

function computeNPFromArray(powers) {
  if (powers.length < 30) return avg(powers)
  var sum = 0
  for (var i = 0; i < 30; i++) sum += (powers[i] || 0)
  var fourth = 0
  var count = 0
  for (var i = 30; i < powers.length; i++) {
    sum += (powers[i] || 0) - (powers[i - 30] || 0)
    var r = sum / 30
    fourth += r * r * r * r
    count++
  }
  return count > 0 ? Math.pow(fourth / count, 0.25) : avg(powers)
}

function detectClimbsSimple(points) {
  var climbs = []
  var minGain = 50
  var minGradient = 3
  var smoothed = smoothAltitude(points, 10)

  var inClimb = false
  var climbStart = 0
  var climbMinAlt = 0
  var runningGain = 0

  for (var i = 1; i < smoothed.length; i++) {
    var diff = smoothed[i] - smoothed[i - 1]

    if (!inClimb) {
      if (diff > 0.1) {
        inClimb = true
        climbStart = i - 1
        climbMinAlt = smoothed[i - 1]
        runningGain = diff
      }
    } else {
      if (diff > 0) runningGain += diff

      var lookback = Math.min(30, i - climbStart)
      var recentTrend = smoothed[i] - smoothed[Math.max(0, i - lookback)]
      if (recentTrend < -10 || i === smoothed.length - 1) {
        var peakIdx = i
        var peakAlt = smoothed[climbStart]
        for (var j = climbStart; j <= i; j++) {
          if (smoothed[j] > peakAlt) { peakAlt = smoothed[j]; peakIdx = j }
        }

        var elevGain = peakAlt - climbMinAlt
        var dist = (points[peakIdx].distance_meters || 0) - (points[climbStart].distance_meters || 0)
        var gradient = dist > 0 ? (elevGain / dist) * 100 : 0

        if (elevGain >= minGain && gradient >= minGradient) {
          var seg = points.slice(climbStart, peakIdx + 1)
          var dur = points[peakIdx].elapsed_seconds - points[climbStart].elapsed_seconds
          var powers = seg.filter(function (p) { return p.power > 0 }).map(function (p) { return p.power })
          var hrs = seg.filter(function (p) { return p.heart_rate > 0 }).map(function (p) { return p.heart_rate })
          var cads = seg.filter(function (p) { return p.cadence > 0 }).map(function (p) { return p.cadence })

          climbs.push({
            start_seconds: points[climbStart].elapsed_seconds,
            end_seconds: points[peakIdx].elapsed_seconds,
            duration_seconds: dur,
            start_distance: points[climbStart].distance_meters || 0,
            end_distance: points[peakIdx].distance_meters || 0,
            distance_meters: dist,
            elevation_gain: Math.round(elevGain),
            start_altitude: Math.round(climbMinAlt),
            peak_altitude: Math.round(peakAlt),
            avg_gradient: Math.round(gradient * 10) / 10,
            max_gradient: null,
            avg_power: Math.round(avg(powers)),
            max_power: Math.max.apply(null, powers.length ? powers : [0]),
            normalized_power: powers.length >= 30 ? Math.round(computeNPFromArray(powers)) : Math.round(avg(powers)),
            avg_hr: Math.round(avg(hrs)),
            max_hr: Math.max.apply(null, hrs.length ? hrs : [0]),
            avg_cadence: Math.round(avg(cads)),
            avg_speed: dist > 0 && dur > 0 ? Math.round(dist / dur * 3.6 * 10) / 10 : 0,
            vam: dur > 0 ? Math.round(elevGain / (dur / 3600)) : 0,
            category: climbCat(elevGain, dist, gradient)
          })
        }

        inClimb = false
        runningGain = 0
      }
    }
  }

  return climbs
}

function smoothAltitude(points, window) {
  var alts = points.map(function (p) { return p.altitude || 0 })
  var result = []
  var sum = 0
  for (var i = 0; i < alts.length; i++) {
    sum += alts[i]
    if (i >= window) sum -= alts[i - window]
    result.push(sum / Math.min(i + 1, window))
  }
  return result
}

function climbCat(gain, distance, gradient) {
  var score = gain * gradient / 100
  if (score > 800) return 'HC'
  if (score > 400) return 'Cat 1'
  if (score > 200) return 'Cat 2'
  if (score > 100) return 'Cat 3'
  return 'Cat 4'
}

function bestPower(powers, duration, points) {
  if (powers.length < duration) return { watts: 0 }
  var bestWatts = 0
  var bestStart = 0
  var sum = 0
  for (var i = 0; i < duration; i++) sum += powers[i]
  bestWatts = sum / duration
  for (var i = duration; i < powers.length; i++) {
    sum += powers[i] - powers[i - duration]
    var current = sum / duration
    if (current > bestWatts) {
      bestWatts = current
      bestStart = i - duration + 1
    }
  }

  // Context for the best effort window
  var seg = points.slice(bestStart, bestStart + duration)
  var hrs = seg.filter(function (p) { return p.heart_rate > 0 }).map(function (p) { return p.heart_rate })
  var cads = seg.filter(function (p) { return p.cadence > 0 }).map(function (p) { return p.cadence })
  var grads = []
  for (var i = 1; i < seg.length; i++) {
    var d = (seg[i].distance_meters || 0) - (seg[i - 1].distance_meters || 0)
    if (d > 1 && seg[i].altitude != null && seg[i - 1].altitude != null) {
      grads.push((seg[i].altitude - seg[i - 1].altitude) / d * 100)
    }
  }
  var alts = seg.filter(function (p) { return p.altitude != null }).map(function (p) { return p.altitude })

  return {
    watts: Math.round(bestWatts),
    start_seconds: points[bestStart].elapsed_seconds,
    avg_hr: Math.round(avg(hrs)) || null,
    avg_cadence: Math.round(avg(cads)) || null,
    avg_gradient: grads.length ? Math.round(avg(grads) * 10) / 10 : null,
    avg_altitude: alts.length ? Math.round(avg(alts)) : null
  }
}

function avg(arr) {
  if (!arr.length) return 0
  var sum = 0
  for (var i = 0; i < arr.length; i++) sum += arr[i]
  return sum / arr.length
}

function formatDur(seconds) {
  var h = Math.floor(seconds / 3600)
  var m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return h + 'h ' + (m < 10 ? '0' : '') + m + 'm'
  return m + 'm'
}
