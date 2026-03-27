// ─────────────────────────────────────────────────────────────
// ACTIVITY STORE — Fixed-rate 1Hz vector storage
//
// Core idea: on load, resample everything to exactly 1 sample/second.
// Then array[i] = value at second i. No searching, no parsing.
//
//   power[3600]           → power at 1 hour mark. O(1).
//   power.slice(600, 900) → power from min 10 to min 15. O(1).
//   sum(power, 0, 300)/300 → avg power first 5 min. O(n) but n=300.
//
// Every downstream algorithm works on plain arrays. The AI generates
// simpler code because it never has to handle gaps or irregular time.
// ─────────────────────────────────────────────────────────────

import { formatDuration } from './cycling-functions.js'

// ── ACTIVITY STORE ───────────────────────────────────────────

export class ActivityStore {
  constructor() {
    this.activities = new Map()
    this.activeId = null
  }

  // Load parsed points → resample to 1Hz vectors
  load(id, rawPoints, metadata) {
    var meta = metadata || {}
    if (!rawPoints || !rawPoints.length) throw new Error('No points')

    // Normalize elapsed_seconds to start at 0
    var t0 = rawPoints[0].elapsed_seconds || 0
    var points = rawPoints.map(function (p) {
      var copy = {}
      for (var k in p) copy[k] = p[k]
      copy.elapsed_seconds = (p.elapsed_seconds || 0) - t0
      return copy
    })

    var duration = Math.ceil(points[points.length - 1].elapsed_seconds)
    var len = duration + 1 // seconds 0..duration inclusive

    // Build 1Hz typed arrays by interpolating raw points
    var v = {
      power:     new Float32Array(len),
      heart_rate: new Float32Array(len),
      cadence:   new Float32Array(len),
      speed:     new Float32Array(len),
      altitude:  new Float32Array(len),
      distance:  new Float32Array(len),
      latitude:  new Float64Array(len),
      longitude: new Float64Array(len),
      temperature: new Float32Array(len),
      gradient:  new Float32Array(len)
    }

    // Detect which fields actually have data
    var hasField = {}
    var fieldNames = ['power', 'heart_rate', 'cadence', 'speed', 'altitude',
      'distance_meters', 'latitude', 'longitude', 'temperature']
    for (var f = 0; f < fieldNames.length; f++) {
      var fn = fieldNames[f]
      hasField[fn] = points.some(function (p) { return p[fn] != null && p[fn] !== 0 })
    }

    // Resample: for each integer second, interpolate between surrounding raw points
    var rawIdx = 0
    for (var sec = 0; sec < len; sec++) {
      // Advance rawIdx to bracket this second
      while (rawIdx < points.length - 1 && points[rawIdx + 1].elapsed_seconds <= sec) {
        rawIdx++
      }

      var p1 = points[rawIdx]
      var p2 = rawIdx < points.length - 1 ? points[rawIdx + 1] : p1

      // Interpolation factor
      var dt = p2.elapsed_seconds - p1.elapsed_seconds
      var t = dt > 0 ? (sec - p1.elapsed_seconds) / dt : 0
      if (t < 0) t = 0
      if (t > 1) t = 1

      // Interpolate each field
      v.power[sec]      = interp(p1.power, p2.power, t)
      v.heart_rate[sec] = interp(p1.heart_rate, p2.heart_rate, t)
      v.cadence[sec]    = interp(p1.cadence, p2.cadence, t)
      v.speed[sec]      = interpF(p1.speed, p2.speed, t)
      v.altitude[sec]   = interpF(p1.altitude, p2.altitude, t)
      v.distance[sec]   = interpF(p1.distance_meters, p2.distance_meters, t)
      v.latitude[sec]   = interpF(p1.latitude, p2.latitude, t)
      v.longitude[sec]  = interpF(p1.longitude, p2.longitude, t)
      v.temperature[sec]= interpF(p1.temperature, p2.temperature, t)
    }

    // Compute gradient from altitude + distance
    if (hasField.altitude && hasField.distance_meters) {
      // Smooth altitude first (10s window)
      var smoothAlt = smooth(v.altitude, 10)
      for (var i = 1; i < len; i++) {
        var dd = v.distance[i] - v.distance[i - 1]
        if (dd > 0.5) {
          v.gradient[i] = (smoothAlt[i] - smoothAlt[i - 1]) / dd * 100
        } else {
          v.gradient[i] = v.gradient[i - 1] || 0
        }
      }
    }

    // Build prefix sums for O(1) range queries
    var prefix = {}
    var prefixFields = ['power', 'heart_rate', 'cadence', 'speed', 'altitude', 'gradient']
    for (var f = 0; f < prefixFields.length; f++) {
      var name = prefixFields[f]
      prefix[name] = buildPrefix(v[name])
    }

    // Pre-bucket at useful resolutions
    var buckets60 = buildBuckets(v, 60, len)
    var buckets300 = buildBuckets(v, 300, len)

    var fields = []
    if (hasField.power) fields.push('power')
    if (hasField.heart_rate) fields.push('heart_rate')
    if (hasField.cadence) fields.push('cadence')
    if (hasField.speed) fields.push('speed')
    if (hasField.altitude) fields.push('altitude')
    if (hasField.distance_meters) fields.push('distance')
    if (hasField.latitude) fields.push('latitude', 'longitude')
    if (hasField.temperature) fields.push('temperature')
    if (hasField.altitude && hasField.distance_meters) fields.push('gradient')

    var activity = {
      id: id,
      // The vectors — this IS the activity
      v: v,
      duration: duration,
      len: len,
      // Raw points preserved for functions that need per-point objects
      raw: points,
      // Precomputed
      prefix: prefix,
      buckets60: buckets60,
      buckets300: buckets300,
      // Metadata
      meta: {
        name: meta.name || id,
        date: meta.date || (points[0] && points[0].timestamp) || null,
        format: meta.format || 'unknown',
        duration: duration,
        duration_formatted: formatDuration(duration),
        total_distance: v.distance[len - 1],
        point_count: rawPoints.length,
        sample_rate_hz: rawPoints.length / duration,
        fields: fields,
        has_power: hasField.power,
        has_hr: hasField.heart_rate,
        has_cadence: hasField.cadence,
        has_gps: hasField.latitude,
        has_altitude: hasField.altitude,
        has_speed: hasField.speed,
        has_temperature: hasField.temperature,
        start_timestamp: points[0].timestamp || null,
        end_timestamp: points[points.length - 1].timestamp || null
      }
    }

    this.activities.set(id, activity)
    this.activeId = id
    return activity.meta
  }

  active() { return this.activeId ? this.activities.get(this.activeId) : null }
  setActive(id) {
    if (!this.activities.has(id)) throw new Error('Activity not found: ' + id)
    this.activeId = id
  }

  // ── VECTOR ACCESS ─────────────────────────────────────────
  // These return typed arrays or slices. array[i] = second i.

  // Get a vector by name: 'power', 'heart_rate', 'cadence', etc.
  vec(field) {
    var a = this.active()
    return a ? a.v[field] : null
  }

  // Get a slice of a vector: seconds [start, end)
  slice(field, start, end) {
    var a = this.active()
    if (!a) return null
    var s = Math.max(0, Math.floor(start))
    var e = Math.min(a.len, Math.ceil(end))
    return a.v[field].slice(s, e)
  }

  // Value at exact second
  at(field, second) {
    var a = this.active()
    if (!a) return 0
    var s = Math.max(0, Math.min(Math.round(second), a.duration))
    return a.v[field][s]
  }

  // ── O(1) RANGE QUERIES via prefix sums ─────────────────────

  // Average of field from second start to second end (inclusive)
  avg(field, start, end) {
    var a = this.active()
    if (!a || !a.prefix[field]) return 0
    var s = Math.max(0, Math.floor(start))
    var e = Math.min(a.len - 1, Math.floor(end))
    if (e <= s) return a.v[field][s] || 0
    var sum = a.prefix[field][e + 1] - a.prefix[field][s]
    return sum / (e - s + 1)
  }

  // Sum of field from start to end
  sum(field, start, end) {
    var a = this.active()
    if (!a || !a.prefix[field]) return 0
    var s = Math.max(0, Math.floor(start))
    var e = Math.min(a.len - 1, Math.floor(end))
    return a.prefix[field][e + 1] - a.prefix[field][s]
  }

  // Max in range (no prefix trick — linear scan on the slice, but slice is small)
  max(field, start, end) {
    var a = this.active()
    if (!a) return 0
    var s = Math.max(0, Math.floor(start))
    var e = Math.min(a.len, Math.ceil(end))
    var arr = a.v[field]
    var mx = -Infinity
    for (var i = s; i < e; i++) {
      if (arr[i] > mx) mx = arr[i]
    }
    return mx === -Infinity ? 0 : mx
  }

  // Min in range
  min(field, start, end) {
    var a = this.active()
    if (!a) return 0
    var s = Math.max(0, Math.floor(start))
    var e = Math.min(a.len, Math.ceil(end))
    var arr = a.v[field]
    var mn = Infinity
    for (var i = s; i < e; i++) {
      if (arr[i] > 0 && arr[i] < mn) mn = arr[i] // skip zeros
    }
    return mn === Infinity ? 0 : mn
  }

  // ── CONVENIENCE QUERIES ────────────────────────────────────

  // Normalized Power for a range
  np(start, end) {
    var a = this.active()
    if (!a) return 0
    var s = Math.max(0, Math.floor(start))
    var e = Math.min(a.len, Math.ceil(end))
    var power = a.v.power
    if (e - s < 30) return this.avg('power', s, e)

    // 30s rolling average → 4th power → mean → 4th root
    var rolling = 0
    var fourth = 0
    var count = 0
    for (var i = s; i < e; i++) {
      rolling += power[i]
      if (i - s >= 30) rolling -= power[i - 30]
      if (i - s >= 29) {
        var r = rolling / 30
        fourth += r * r * r * r
        count++
      }
    }
    return count > 0 ? Math.pow(fourth / count, 0.25) : 0
  }

  // Best N-second average for a field in range [searchStart, searchEnd)
  best(field, windowSeconds, searchStart, searchEnd) {
    var a = this.active()
    if (!a) return { value: 0, at: 0 }
    var s = Math.max(0, Math.floor(searchStart || 0))
    var e = Math.min(a.len, Math.ceil(searchEnd || a.len))
    var arr = a.v[field]
    var w = windowSeconds

    if (e - s < w) return { value: this.avg(field, s, e), at: s }

    // Use prefix sums for O(1) per window position
    var px = a.prefix[field]
    var bestVal = -Infinity
    var bestAt = s
    for (var i = s; i <= e - w; i++) {
      var avg = (px[i + w] - px[i]) / w
      if (avg > bestVal) { bestVal = avg; bestAt = i }
    }
    return { value: bestVal, at: bestAt }
  }

  // ── PRE-BUCKETED DATA ──────────────────────────────────────

  // timeBucket(60) returns precomputed 1-minute averages
  timeBucket(seconds) {
    var a = this.active()
    if (!a) return []
    if (seconds === 60) return a.buckets60
    if (seconds === 300) return a.buckets300
    // Compute on the fly for other sizes
    return buildBuckets(a.v, seconds, a.len)
  }

  // ── RAW POINTS ACCESS (for cycling-functions.js compatibility) ─

  points() {
    var a = this.active()
    return a ? a.raw : []
  }

  meta() {
    var a = this.active()
    return a ? a.meta : null
  }

  // Reconstruct point objects from vectors for a time range
  // (for functions that need [{elapsed_seconds, power, ...}])
  pointsInRange(start, end) {
    var a = this.active()
    if (!a) return []
    var s = Math.max(0, Math.floor(start))
    var e = Math.min(a.len, Math.ceil(end))
    var result = []
    for (var i = s; i < e; i++) {
      result.push(pointFromVectors(a.v, i))
    }
    return result
  }

  // ── DESCRIBE ───────────────────────────────────────────────

  describe() {
    var a = this.active()
    if (!a) return 'No activity loaded.'
    var m = a.meta
    return [
      'Activity: ' + m.name,
      'Storage: 1Hz vectors, ' + a.len + ' seconds (' + m.duration_formatted + ')',
      'Original points: ' + m.point_count + ' (' + m.sample_rate_hz.toFixed(1) + ' Hz) → resampled to 1Hz',
      'Distance: ' + (m.total_distance / 1000).toFixed(1) + ' km',
      'Fields: ' + m.fields.join(', '),
      'Access pattern: vec("power")[3600] = power at 1hr. slice("power", 600, 900) = power min 10-15.',
      'Range queries: avg("power", 0, 300) = O(1) via prefix sums.',
      'Best efforts: best("power", 300) = best 5min power, O(n) single pass.'
    ].join('\n')
  }

  summary(options) {
    var a = this.active()
    if (!a) return null
    var opts = options || {}
    var ftp = opts.ftp || 250
    var dur = a.duration
    var npVal = this.np(0, dur)
    var ifVal = npVal / ftp
    var tss = (dur * npVal * ifVal) / (ftp * 3600) * 100

    return {
      duration_seconds: dur,
      duration_formatted: a.meta.duration_formatted,
      distance_km: Math.round(a.meta.total_distance / 100) / 10,
      avg_power: Math.round(this.avg('power', 0, dur)),
      max_power: Math.round(this.max('power', 0, dur)),
      normalized_power: Math.round(npVal),
      intensity_factor: Math.round(ifVal * 100) / 100,
      tss: Math.round(tss),
      avg_hr: Math.round(this.avg('heart_rate', 0, dur)),
      max_hr: Math.round(this.max('heart_rate', 0, dur)),
      avg_cadence: Math.round(this.avg('cadence', 0, dur)),
      avg_speed_kmh: Math.round(this.avg('speed', 0, dur) * 3.6 * 10) / 10,
      max_speed_kmh: Math.round(this.max('speed', 0, dur) * 3.6 * 10) / 10,
      elevation_gain: computeElevGain(a.v.altitude, a.len),
      elevation_loss: computeElevLoss(a.v.altitude, a.len),
      point_count: a.meta.point_count,
      fields: a.meta.fields
    }
  }

  // ── MANAGEMENT ─────────────────────────────────────────────

  list() {
    var result = []
    this.activities.forEach(function (a, id) {
      result.push({
        id: id, name: a.meta.name, date: a.meta.date,
        duration: a.meta.duration_formatted,
        distance_km: Math.round(a.meta.total_distance / 100) / 10,
        seconds: a.len
      })
    })
    return result
  }

  remove(id) {
    this.activities.delete(id)
    if (this.activeId === id) {
      this.activeId = this.activities.size > 0 ? this.activities.keys().next().value : null
    }
  }
}

// ── INTERNALS ────────────────────────────────────────────────

// Interpolate integer values (power, HR, cadence) — round
function interp(a, b, t) {
  if (a == null || a === 0) return b || 0
  if (b == null || b === 0) return a || 0
  return Math.round(a + (b - a) * t)
}

// Interpolate float values (speed, altitude, distance)
function interpF(a, b, t) {
  if (a == null) return b || 0
  if (b == null) return a || 0
  return a + (b - a) * t
}

// Build prefix sum array: prefix[i] = sum of arr[0..i-1]
// So sum from a to b (inclusive) = prefix[b+1] - prefix[a]
function buildPrefix(arr) {
  var prefix = new Float64Array(arr.length + 1)
  for (var i = 0; i < arr.length; i++) {
    prefix[i + 1] = prefix[i] + arr[i]
  }
  return prefix
}

// Smooth a vector with a rolling average
function smooth(arr, window) {
  var result = new Float32Array(arr.length)
  var sum = 0
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i]
    if (i >= window) sum -= arr[i - window]
    result[i] = sum / Math.min(i + 1, window)
  }
  return result
}

// Build time buckets: one object per N-second interval
function buildBuckets(v, bucketSeconds, len) {
  var buckets = []
  for (var t = 0; t < len; t += bucketSeconds) {
    var end = Math.min(t + bucketSeconds, len)
    var count = end - t
    if (count < 1) continue

    var pSum = 0, hrSum = 0, cadSum = 0, spdSum = 0
    var pMax = 0, hrMax = 0
    for (var i = t; i < end; i++) {
      pSum += v.power[i]
      hrSum += v.heart_rate[i]
      cadSum += v.cadence[i]
      spdSum += v.speed[i]
      if (v.power[i] > pMax) pMax = v.power[i]
      if (v.heart_rate[i] > hrMax) hrMax = v.heart_rate[i]
    }

    buckets.push({
      start: t,
      end: end,
      time_label: formatDuration(t),
      power_avg: Math.round(pSum / count),
      power_max: Math.round(pMax),
      hr_avg: Math.round(hrSum / count),
      hr_max: Math.round(hrMax),
      cadence_avg: Math.round(cadSum / count),
      speed_avg: Math.round(spdSum / count * 3.6 * 10) / 10, // km/h
      altitude_start: Math.round(v.altitude[t]),
      altitude_end: Math.round(v.altitude[end - 1]),
      gradient_avg: count > 1
        ? Math.round((v.altitude[end - 1] - v.altitude[t]) / Math.max(1, v.distance[end - 1] - v.distance[t]) * 1000) / 10
        : 0,
      distance: Math.round(v.distance[end - 1] - v.distance[t])
    })
  }
  return buckets
}

// Reconstruct a point object from vectors at index i
function pointFromVectors(v, i) {
  return {
    elapsed_seconds: i,
    power: v.power[i],
    heart_rate: v.heart_rate[i],
    cadence: v.cadence[i],
    speed: v.speed[i],
    altitude: v.altitude[i],
    distance_meters: v.distance[i],
    latitude: v.latitude[i],
    longitude: v.longitude[i],
    temperature: v.temperature[i],
    gradient: v.gradient[i]
  }
}

function computeElevGain(altArr, len) {
  var gain = 0
  for (var i = 1; i < len; i++) {
    var diff = altArr[i] - altArr[i - 1]
    if (diff > 0) gain += diff
  }
  return Math.round(gain)
}

function computeElevLoss(altArr, len) {
  var loss = 0
  for (var i = 1; i < len; i++) {
    var diff = altArr[i] - altArr[i - 1]
    if (diff < 0) loss -= diff
  }
  return Math.round(loss)
}

// ── SINGLETON ────────────────────────────────────────────────

export var store = new ActivityStore()
export default store
