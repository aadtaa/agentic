// ─────────────────────────────────────────────────────────────
// CYCLING DOMAIN FUNCTION LIBRARY
// Pure functions operating on activity point arrays
// Point shape: { elapsed_seconds, timestamp, latitude, longitude,
//   altitude, heart_rate, cadence, power, speed, distance_meters, temperature }
// ─────────────────────────────────────────────────────────────

// ── HELPERS ──────────────────────────────────────────────────

function haversine(lat1, lon1, lat2, lon2) {
  var R = 6371000
  var dLat = (lat2 - lat1) * Math.PI / 180
  var dLon = (lon2 - lon1) * Math.PI / 180
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function rollingAverage(values, windowSize) {
  var result = []
  var sum = 0
  for (var i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= windowSize) sum -= values[i - windowSize]
    var count = Math.min(i + 1, windowSize)
    result.push(sum / count)
  }
  return result
}

function percentile(arr, p) {
  var sorted = arr.slice().sort(function (a, b) { return a - b })
  var idx = (p / 100) * (sorted.length - 1)
  var lo = Math.floor(idx)
  var hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function mean(arr) {
  if (!arr.length) return 0
  var sum = 0
  for (var i = 0; i < arr.length; i++) sum += arr[i]
  return sum / arr.length
}

function standardDeviation(arr) {
  var m = mean(arr)
  var squareDiffs = arr.map(function (v) { return (v - m) * (v - m) })
  return Math.sqrt(mean(squareDiffs))
}

// ── TIME SLICING ─────────────────────────────────────────────

export function sliceByTime(points, startSeconds, endSeconds) {
  return points.filter(function (p) {
    return p.elapsed_seconds >= startSeconds && p.elapsed_seconds <= endSeconds
  })
}

export function sliceByDistance(points, startMeters, endMeters) {
  return points.filter(function (p) {
    return p.distance_meters >= startMeters && p.distance_meters <= endMeters
  })
}

export function resample(points, targetCount) {
  if (points.length <= targetCount) return points
  var step = points.length / targetCount
  var result = []
  for (var i = 0; i < targetCount; i++) {
    result.push(points[Math.floor(i * step)])
  }
  return result
}

export function resampleByInterval(points, intervalSeconds) {
  if (!points.length) return []
  var result = []
  var nextTime = points[0].elapsed_seconds
  var endTime = points[points.length - 1].elapsed_seconds
  var idx = 0
  while (nextTime <= endTime) {
    while (idx < points.length - 1 && points[idx + 1].elapsed_seconds <= nextTime) idx++
    result.push(points[idx])
    nextTime += intervalSeconds
  }
  return result
}

// ── POWER METRICS ────────────────────────────────────────────

export function normalizedPower(points) {
  var powers = points.map(function (p) { return p.power || 0 })
  if (powers.length < 30) return mean(powers)
  var rolling30 = rollingAverage(powers, 30)
  var fourth = rolling30.map(function (v) { return v * v * v * v })
  return Math.pow(mean(fourth), 0.25)
}

export function intensityFactor(points, ftp) {
  return normalizedPower(points) / ftp
}

export function trainingStressScore(points, ftp) {
  var duration = points[points.length - 1].elapsed_seconds - points[0].elapsed_seconds
  var np = normalizedPower(points)
  var intFactor = np / ftp
  return (duration * np * intFactor) / (ftp * 3600) * 100
}

export function variabilityIndex(points) {
  var np = normalizedPower(points)
  var avg = averagePower(points)
  return avg > 0 ? np / avg : 0
}

export function averagePower(points) {
  var powers = points.filter(function (p) { return p.power > 0 }).map(function (p) { return p.power })
  return mean(powers)
}

export function maxPower(points) {
  var max = 0
  for (var i = 0; i < points.length; i++) {
    if ((points[i].power || 0) > max) max = points[i].power
  }
  return max
}

export function weightedAveragePower(points) {
  return normalizedPower(points)
}

export function efficiencyFactor(points) {
  var np = normalizedPower(points)
  var avgHR = averageHeartRate(points)
  return avgHR > 0 ? np / avgHR : 0
}

// Best power over a given duration in seconds (rolling window)
export function bestPowerForDuration(points, durationSeconds) {
  var powers = points.map(function (p) { return p.power || 0 })
  if (powers.length < durationSeconds) return mean(powers)
  var best = 0
  var sum = 0
  for (var i = 0; i < durationSeconds; i++) sum += powers[i]
  best = sum / durationSeconds
  for (var i = durationSeconds; i < powers.length; i++) {
    sum += powers[i] - powers[i - durationSeconds]
    var avg = sum / durationSeconds
    if (avg > best) best = avg
  }
  return best
}

// Power duration curve: best average power at standard durations
export function powerDurationCurve(points) {
  var durations = [1, 5, 15, 30, 60, 120, 180, 300, 480, 720, 1200, 1800, 3600]
  var totalSeconds = points.length > 0
    ? points[points.length - 1].elapsed_seconds - points[0].elapsed_seconds
    : 0
  var result = []
  for (var i = 0; i < durations.length; i++) {
    if (durations[i] > totalSeconds) break
    result.push({
      duration_seconds: durations[i],
      duration_label: formatDuration(durations[i]),
      watts: Math.round(bestPowerForDuration(points, durations[i]))
    })
  }
  return result
}

// ── POWER ZONES (Coggan 7-zone) ──────────────────────────────

export function powerZones(ftp) {
  return [
    { zone: 1, name: 'Active Recovery', min: 0, max: Math.round(ftp * 0.55) },
    { zone: 2, name: 'Endurance', min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75) },
    { zone: 3, name: 'Tempo', min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.90) },
    { zone: 4, name: 'Threshold', min: Math.round(ftp * 0.90), max: Math.round(ftp * 1.05) },
    { zone: 5, name: 'VO2max', min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.20) },
    { zone: 6, name: 'Anaerobic', min: Math.round(ftp * 1.20), max: Math.round(ftp * 1.50) },
    { zone: 7, name: 'Neuromuscular', min: Math.round(ftp * 1.50), max: 9999 }
  ]
}

export function timeInPowerZones(points, ftp) {
  var zones = powerZones(ftp)
  var times = zones.map(function () { return 0 })
  for (var i = 1; i < points.length; i++) {
    var p = points[i].power || 0
    var dt = points[i].elapsed_seconds - points[i - 1].elapsed_seconds
    if (dt > 10) dt = 1 // gap protection
    for (var z = zones.length - 1; z >= 0; z--) {
      if (p >= zones[z].min) { times[z] += dt; break }
    }
  }
  return zones.map(function (z, i) {
    return {
      zone: z.zone, name: z.name, min: z.min, max: z.max,
      seconds: Math.round(times[i]),
      formatted: formatDuration(Math.round(times[i])),
      percentage: 0
    }
  }).map(function (z) {
    var total = times.reduce(function (a, b) { return a + b }, 0)
    z.percentage = total > 0 ? Math.round(z.seconds / total * 100) : 0
    return z
  })
}

// ── HR ZONES (5-zone) ────────────────────────────────────────

export function hrZones(maxHR, restingHR) {
  // Karvonen method using HR reserve
  var reserve = maxHR - restingHR
  return [
    { zone: 1, name: 'Recovery', min: restingHR, max: Math.round(restingHR + reserve * 0.60) },
    { zone: 2, name: 'Aerobic', min: Math.round(restingHR + reserve * 0.60), max: Math.round(restingHR + reserve * 0.70) },
    { zone: 3, name: 'Tempo', min: Math.round(restingHR + reserve * 0.70), max: Math.round(restingHR + reserve * 0.80) },
    { zone: 4, name: 'Threshold', min: Math.round(restingHR + reserve * 0.80), max: Math.round(restingHR + reserve * 0.90) },
    { zone: 5, name: 'VO2max', min: Math.round(restingHR + reserve * 0.90), max: maxHR }
  ]
}

export function timeInHRZones(points, maxHR, restingHR) {
  var zones = hrZones(maxHR, restingHR)
  var times = zones.map(function () { return 0 })
  for (var i = 1; i < points.length; i++) {
    var hr = points[i].heart_rate || 0
    var dt = points[i].elapsed_seconds - points[i - 1].elapsed_seconds
    if (dt > 10) dt = 1
    for (var z = zones.length - 1; z >= 0; z--) {
      if (hr >= zones[z].min) { times[z] += dt; break }
    }
  }
  var total = times.reduce(function (a, b) { return a + b }, 0)
  return zones.map(function (z, i) {
    return {
      zone: z.zone, name: z.name, min: z.min, max: z.max,
      seconds: Math.round(times[i]),
      formatted: formatDuration(Math.round(times[i])),
      percentage: total > 0 ? Math.round(times[i] / total * 100) : 0
    }
  })
}

// ── HR METRICS ───────────────────────────────────────────────

export function averageHeartRate(points) {
  var hrs = points.filter(function (p) { return p.heart_rate > 0 }).map(function (p) { return p.heart_rate })
  return Math.round(mean(hrs))
}

export function maxHeartRate(points) {
  var max = 0
  for (var i = 0; i < points.length; i++) {
    if ((points[i].heart_rate || 0) > max) max = points[i].heart_rate
  }
  return max
}

// HR-power decoupling: compare first half vs second half NP:HR ratio
export function hrPowerDecoupling(points) {
  var mid = Math.floor(points.length / 2)
  var first = points.slice(0, mid)
  var second = points.slice(mid)
  var np1 = normalizedPower(first)
  var hr1 = averageHeartRate(first)
  var np2 = normalizedPower(second)
  var hr2 = averageHeartRate(second)
  if (hr1 === 0 || hr2 === 0) return null
  var ef1 = np1 / hr1
  var ef2 = np2 / hr2
  return Math.round((ef1 - ef2) / ef1 * 10000) / 100 // percentage
}

// ── CADENCE ──────────────────────────────────────────────────

export function averageCadence(points) {
  var cads = points.filter(function (p) { return p.cadence > 0 }).map(function (p) { return p.cadence })
  return Math.round(mean(cads))
}

export function cadenceDistribution(points) {
  var buckets = [
    { label: '0-60', min: 0, max: 60, seconds: 0 },
    { label: '60-70', min: 60, max: 70, seconds: 0 },
    { label: '70-80', min: 70, max: 80, seconds: 0 },
    { label: '80-90', min: 80, max: 90, seconds: 0 },
    { label: '90-100', min: 90, max: 100, seconds: 0 },
    { label: '100-110', min: 100, max: 110, seconds: 0 },
    { label: '110+', min: 110, max: 9999, seconds: 0 }
  ]
  for (var i = 1; i < points.length; i++) {
    var c = points[i].cadence || 0
    if (c === 0) continue
    var dt = points[i].elapsed_seconds - points[i - 1].elapsed_seconds
    if (dt > 10) dt = 1
    for (var b = buckets.length - 1; b >= 0; b--) {
      if (c >= buckets[b].min) { buckets[b].seconds += dt; break }
    }
  }
  return buckets
}

// ── CLIMB DETECTION ──────────────────────────────────────────

export function detectClimbs(points, options) {
  var opts = options || {}
  var minGainMeters = opts.minGain || 50   // minimum elevation gain to qualify
  var minGradient = opts.minGradient || 3   // minimum average gradient %
  var smoothWindow = opts.smoothWindow || 10

  // Smooth altitude
  var altitudes = points.map(function (p) { return p.altitude || 0 })
  var smoothed = rollingAverage(altitudes, smoothWindow)

  var climbs = []
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
      if (diff > 0) {
        runningGain += diff
      }
      // End climb on sustained descent (30 points of net downhill)
      var lookback = Math.min(30, i - climbStart)
      var recentTrend = smoothed[i] - smoothed[Math.max(0, i - lookback)]
      if (recentTrend < -10 || i === smoothed.length - 1) {
        // Find the actual peak
        var peakIdx = i
        var peakAlt = smoothed[climbStart]
        for (var j = climbStart; j <= i; j++) {
          if (smoothed[j] > peakAlt) { peakAlt = smoothed[j]; peakIdx = j }
        }

        var elevGain = peakAlt - climbMinAlt
        var dist = (points[peakIdx].distance_meters || 0) - (points[climbStart].distance_meters || 0)
        var gradient = dist > 0 ? (elevGain / dist) * 100 : 0

        if (elevGain >= minGainMeters && gradient >= minGradient) {
          var climbPoints = points.slice(climbStart, peakIdx + 1)
          climbs.push({
            start_index: climbStart,
            end_index: peakIdx,
            start_seconds: points[climbStart].elapsed_seconds,
            end_seconds: points[peakIdx].elapsed_seconds,
            duration_seconds: points[peakIdx].elapsed_seconds - points[climbStart].elapsed_seconds,
            duration_formatted: formatDuration(points[peakIdx].elapsed_seconds - points[climbStart].elapsed_seconds),
            start_distance: points[climbStart].distance_meters || 0,
            end_distance: points[peakIdx].distance_meters || 0,
            distance_meters: dist,
            elevation_gain: Math.round(elevGain),
            start_altitude: Math.round(climbMinAlt),
            peak_altitude: Math.round(peakAlt),
            average_gradient: Math.round(gradient * 10) / 10,
            max_gradient: maxGradientInSegment(points, climbStart, peakIdx),
            average_power: Math.round(averagePower(climbPoints)),
            normalized_power: Math.round(normalizedPower(climbPoints)),
            average_hr: averageHeartRate(climbPoints),
            average_cadence: averageCadence(climbPoints),
            vam: dist > 0 ? Math.round(elevGain / ((points[peakIdx].elapsed_seconds - points[climbStart].elapsed_seconds) / 3600)) : 0,
            category: climbCategory(elevGain, dist, gradient)
          })
        }

        inClimb = false
        runningGain = 0
      }
    }
  }

  return climbs.sort(function (a, b) { return b.elevation_gain - a.elevation_gain })
}

function climbCategory(gain, distance, gradient) {
  // Simplified climb categorization inspired by Tour de France
  var score = gain * gradient / 100
  if (score > 800) return 'HC'
  if (score > 400) return 'Cat 1'
  if (score > 200) return 'Cat 2'
  if (score > 100) return 'Cat 3'
  return 'Cat 4'
}

function maxGradientInSegment(points, startIdx, endIdx) {
  var maxGrad = 0
  var windowDist = 100 // 100m rolling gradient
  for (var i = startIdx; i < endIdx; i++) {
    for (var j = i + 1; j <= endIdx; j++) {
      var d = (points[j].distance_meters || 0) - (points[i].distance_meters || 0)
      if (d >= windowDist) {
        var grad = ((points[j].altitude || 0) - (points[i].altitude || 0)) / d * 100
        if (grad > maxGrad) maxGrad = grad
        break
      }
    }
  }
  return Math.round(maxGrad * 10) / 10
}

// ── INTERVAL / EFFORT DETECTION ──────────────────────────────

export function detectIntervals(points, options) {
  var opts = options || {}
  var ftp = opts.ftp || 250
  var minDuration = opts.minDuration || 30        // min seconds for an interval
  var powerThreshold = opts.powerThreshold || 0.85 // fraction of FTP
  var gapTolerance = opts.gapTolerance || 15       // seconds below threshold before ending

  var threshold = ftp * powerThreshold
  var intervals = []
  var inInterval = false
  var start = 0
  var belowCount = 0

  for (var i = 0; i < points.length; i++) {
    var p = points[i].power || 0

    if (!inInterval) {
      if (p >= threshold) {
        inInterval = true
        start = i
        belowCount = 0
      }
    } else {
      if (p < threshold) {
        belowCount++
        if (belowCount > gapTolerance) {
          var endIdx = i - belowCount
          var duration = points[endIdx].elapsed_seconds - points[start].elapsed_seconds
          if (duration >= minDuration) {
            var seg = points.slice(start, endIdx + 1)
            intervals.push({
              start_index: start,
              end_index: endIdx,
              start_seconds: points[start].elapsed_seconds,
              end_seconds: points[endIdx].elapsed_seconds,
              duration_seconds: duration,
              duration_formatted: formatDuration(duration),
              average_power: Math.round(averagePower(seg)),
              normalized_power: Math.round(normalizedPower(seg)),
              max_power: maxPower(seg),
              average_hr: averageHeartRate(seg),
              max_hr: maxHeartRate(seg),
              average_cadence: averageCadence(seg),
              intensity: Math.round(normalizedPower(seg) / ftp * 100) / 100
            })
          }
          inInterval = false
          belowCount = 0
        }
      } else {
        belowCount = 0
      }
    }
  }

  // Close last interval
  if (inInterval) {
    var duration = points[points.length - 1].elapsed_seconds - points[start].elapsed_seconds
    if (duration >= minDuration) {
      var seg = points.slice(start)
      intervals.push({
        start_index: start,
        end_index: points.length - 1,
        start_seconds: points[start].elapsed_seconds,
        end_seconds: points[points.length - 1].elapsed_seconds,
        duration_seconds: duration,
        duration_formatted: formatDuration(duration),
        average_power: Math.round(averagePower(seg)),
        normalized_power: Math.round(normalizedPower(seg)),
        max_power: maxPower(seg),
        average_hr: averageHeartRate(seg),
        max_hr: maxHeartRate(seg),
        average_cadence: averageCadence(seg),
        intensity: Math.round(normalizedPower(seg) / ftp * 100) / 100
      })
    }
  }

  return intervals
}

// ── MATCHES / ANAEROBIC BURN DETECTION ───────────────────────

export function detectMatches(points, options) {
  var opts = options || {}
  var ftp = opts.ftp || 250
  var threshold = opts.threshold || ftp * 1.20 // above 120% FTP
  var minDuration = opts.minDuration || 5

  var matches = []
  var inMatch = false
  var start = 0
  var wprimeCost = 0 // kJ above FTP

  for (var i = 0; i < points.length; i++) {
    var p = points[i].power || 0
    if (!inMatch && p >= threshold) {
      inMatch = true
      start = i
      wprimeCost = 0
    }
    if (inMatch) {
      if (p >= ftp) {
        var dt = i > 0 ? points[i].elapsed_seconds - points[i - 1].elapsed_seconds : 1
        wprimeCost += (p - ftp) * dt / 1000 // kJ
      }
      if (p < ftp || i === points.length - 1) {
        var duration = points[i].elapsed_seconds - points[start].elapsed_seconds
        if (duration >= minDuration) {
          var seg = points.slice(start, i + 1)
          matches.push({
            start_seconds: points[start].elapsed_seconds,
            end_seconds: points[i].elapsed_seconds,
            duration_seconds: duration,
            duration_formatted: formatDuration(duration),
            average_power: Math.round(averagePower(seg)),
            max_power: maxPower(seg),
            wprime_cost_kj: Math.round(wprimeCost * 10) / 10
          })
        }
        inMatch = false
      }
    }
  }
  return matches
}

// ── W' BALANCE (Skiba / Waterworth) ─────────────────────────

export function wPrimeBalance(points, options) {
  var opts = options || {}
  var cp = opts.cp || opts.ftp || 250
  var wPrime = opts.wPrime || 20000 // joules

  var balance = []
  var wBal = wPrime

  for (var i = 0; i < points.length; i++) {
    var p = points[i].power || 0
    var dt = i > 0 ? points[i].elapsed_seconds - points[i - 1].elapsed_seconds : 1
    if (dt > 10) dt = 1

    if (p > cp) {
      // Depleting
      wBal -= (p - cp) * dt
    } else {
      // Recovering (Skiba formula)
      wBal += (wPrime - wBal) * (1 - Math.exp(-dt * (cp - p) / wPrime))
    }

    if (wBal < 0) wBal = 0
    if (wBal > wPrime) wBal = wPrime

    balance.push({
      elapsed_seconds: points[i].elapsed_seconds,
      w_balance: Math.round(wBal),
      w_balance_pct: Math.round(wBal / wPrime * 100),
      power: p
    })
  }

  return balance
}

// ── GRADIENT / ELEVATION ─────────────────────────────────────

export function elevationProfile(points) {
  var totalGain = 0
  var totalLoss = 0
  var minAlt = Infinity
  var maxAlt = -Infinity

  for (var i = 0; i < points.length; i++) {
    var alt = points[i].altitude
    if (alt === undefined || alt === null) continue
    if (alt < minAlt) minAlt = alt
    if (alt > maxAlt) maxAlt = alt
    if (i > 0) {
      var prev = points[i - 1].altitude
      if (prev !== undefined && prev !== null) {
        var diff = alt - prev
        if (diff > 0) totalGain += diff
        else totalLoss += Math.abs(diff)
      }
    }
  }

  return {
    total_gain: Math.round(totalGain),
    total_loss: Math.round(totalLoss),
    min_altitude: Math.round(minAlt),
    max_altitude: Math.round(maxAlt),
    altitude_range: Math.round(maxAlt - minAlt)
  }
}

export function gradientAtPoint(points, index, windowMeters) {
  var w = windowMeters || 100
  var p = points[index]
  var d0 = p.distance_meters || 0
  // Find point ~windowMeters back
  var backIdx = index
  for (var i = index - 1; i >= 0; i--) {
    if (d0 - (points[i].distance_meters || 0) >= w) { backIdx = i; break }
  }
  var dist = d0 - (points[backIdx].distance_meters || 0)
  if (dist < 10) return 0
  var altDiff = (p.altitude || 0) - (points[backIdx].altitude || 0)
  return Math.round(altDiff / dist * 1000) / 10 // %
}

export function gradientProfile(points, segmentMeters) {
  var seg = segmentMeters || 500
  var profile = []
  var startIdx = 0
  for (var i = 1; i < points.length; i++) {
    var d = (points[i].distance_meters || 0) - (points[startIdx].distance_meters || 0)
    if (d >= seg) {
      var altDiff = (points[i].altitude || 0) - (points[startIdx].altitude || 0)
      var gradient = d > 0 ? (altDiff / d) * 100 : 0
      profile.push({
        start_distance: points[startIdx].distance_meters || 0,
        end_distance: points[i].distance_meters || 0,
        distance: d,
        gradient: Math.round(gradient * 10) / 10,
        avg_power: Math.round(averagePower(points.slice(startIdx, i + 1))),
        avg_hr: averageHeartRate(points.slice(startIdx, i + 1)),
        avg_speed: meanSpeed(points.slice(startIdx, i + 1))
      })
      startIdx = i
    }
  }
  return profile
}

// ── SPEED ────────────────────────────────────────────────────

export function meanSpeed(points) {
  var speeds = points.filter(function (p) { return p.speed > 0 }).map(function (p) { return p.speed })
  return Math.round(mean(speeds) * 36) / 10 // m/s to km/h
}

export function maxSpeed(points) {
  var max = 0
  for (var i = 0; i < points.length; i++) {
    if ((points[i].speed || 0) > max) max = points[i].speed
  }
  return Math.round(max * 36) / 10 // km/h
}

// ── ACTIVITY SUMMARY ─────────────────────────────────────────

export function activitySummary(points, options) {
  var opts = options || {}
  var ftp = opts.ftp || 250
  var duration = points.length > 1
    ? points[points.length - 1].elapsed_seconds - points[0].elapsed_seconds
    : 0
  var dist = points.length > 1
    ? (points[points.length - 1].distance_meters || 0) - (points[0].distance_meters || 0)
    : 0
  var elev = elevationProfile(points)

  return {
    duration_seconds: Math.round(duration),
    duration_formatted: formatDuration(duration),
    distance_km: Math.round(dist / 100) / 10,
    distance_miles: Math.round(dist / 1609.34 * 10) / 10,
    elevation_gain: elev.total_gain,
    elevation_loss: elev.total_loss,
    avg_speed_kmh: meanSpeed(points),
    max_speed_kmh: maxSpeed(points),
    avg_power: Math.round(averagePower(points)),
    max_power: maxPower(points),
    normalized_power: Math.round(normalizedPower(points)),
    intensity_factor: Math.round(intensityFactor(points, ftp) * 100) / 100,
    tss: Math.round(trainingStressScore(points, ftp)),
    variability_index: Math.round(variabilityIndex(points) * 100) / 100,
    efficiency_factor: Math.round(efficiencyFactor(points) * 100) / 100,
    avg_hr: averageHeartRate(points),
    max_hr: maxHeartRate(points),
    avg_cadence: averageCadence(points),
    hr_power_decoupling: hrPowerDecoupling(points),
    point_count: points.length,
    sample_rate_hz: points.length > 1 ? Math.round(points.length / duration * 10) / 10 : 0
  }
}

// ── LAP SPLITTING ────────────────────────────────────────────

export function splitByDistance(points, splitMeters) {
  var split = splitMeters || 1000
  var laps = []
  var startIdx = 0
  var lapNum = 1
  for (var i = 1; i < points.length; i++) {
    var d = (points[i].distance_meters || 0) - (points[startIdx].distance_meters || 0)
    if (d >= split || i === points.length - 1) {
      var seg = points.slice(startIdx, i + 1)
      laps.push({
        lap: lapNum++,
        start_distance: points[startIdx].distance_meters || 0,
        end_distance: points[i].distance_meters || 0,
        distance_meters: d,
        duration_seconds: points[i].elapsed_seconds - points[startIdx].elapsed_seconds,
        duration_formatted: formatDuration(points[i].elapsed_seconds - points[startIdx].elapsed_seconds),
        avg_power: Math.round(averagePower(seg)),
        normalized_power: Math.round(normalizedPower(seg)),
        avg_hr: averageHeartRate(seg),
        avg_cadence: averageCadence(seg),
        avg_speed_kmh: meanSpeed(seg),
        elevation_gain: elevationProfile(seg).total_gain
      })
      startIdx = i
    }
  }
  return laps
}

export function splitByTime(points, splitSeconds) {
  var split = splitSeconds || 600 // 10 min default
  var laps = []
  var startIdx = 0
  var lapNum = 1
  var startTime = points[0].elapsed_seconds
  for (var i = 1; i < points.length; i++) {
    var t = points[i].elapsed_seconds - points[startIdx].elapsed_seconds
    if (t >= split || i === points.length - 1) {
      var seg = points.slice(startIdx, i + 1)
      laps.push({
        lap: lapNum++,
        start_seconds: points[startIdx].elapsed_seconds,
        end_seconds: points[i].elapsed_seconds,
        duration_seconds: t,
        duration_formatted: formatDuration(t),
        avg_power: Math.round(averagePower(seg)),
        normalized_power: Math.round(normalizedPower(seg)),
        avg_hr: averageHeartRate(seg),
        avg_cadence: averageCadence(seg),
        avg_speed_kmh: meanSpeed(seg),
        elevation_gain: elevationProfile(seg).total_gain,
        distance_meters: (points[i].distance_meters || 0) - (points[startIdx].distance_meters || 0)
      })
      startIdx = i
    }
  }
  return laps
}

// ── COASTING / PEDALING ANALYSIS ─────────────────────────────

export function pedalingAnalysis(points) {
  var pedaling = 0
  var coasting = 0
  var stopped = 0

  for (var i = 1; i < points.length; i++) {
    var dt = points[i].elapsed_seconds - points[i - 1].elapsed_seconds
    if (dt > 10) dt = 1
    var p = points[i].power || 0
    var s = points[i].speed || 0
    if (s < 0.5) stopped += dt       // < 1.8 km/h
    else if (p > 0) pedaling += dt
    else coasting += dt
  }

  var total = pedaling + coasting + stopped
  return {
    pedaling_seconds: Math.round(pedaling),
    coasting_seconds: Math.round(coasting),
    stopped_seconds: Math.round(stopped),
    pedaling_pct: total > 0 ? Math.round(pedaling / total * 100) : 0,
    coasting_pct: total > 0 ? Math.round(coasting / total * 100) : 0,
    stopped_pct: total > 0 ? Math.round(stopped / total * 100) : 0,
    moving_time_seconds: Math.round(pedaling + coasting),
    moving_time_formatted: formatDuration(pedaling + coasting)
  }
}

// ── POWER SMOOTHING ──────────────────────────────────────────

export function smoothPower(points, windowSeconds) {
  var w = windowSeconds || 30
  var powers = points.map(function (p) { return p.power || 0 })
  var smoothed = rollingAverage(powers, w)
  return points.map(function (p, i) {
    var copy = {}
    for (var k in p) copy[k] = p[k]
    copy.power_smooth = Math.round(smoothed[i])
    return copy
  })
}

// ── STATISTICS ───────────────────────────────────────────────

export function fieldStats(points, field) {
  var values = points.map(function (p) { return p[field] }).filter(function (v) { return v != null && v > 0 })
  if (!values.length) return null
  return {
    field: field,
    count: values.length,
    mean: Math.round(mean(values) * 100) / 100,
    min: Math.min.apply(null, values),
    max: Math.max.apply(null, values),
    std_dev: Math.round(standardDeviation(values) * 100) / 100,
    p5: Math.round(percentile(values, 5) * 100) / 100,
    p25: Math.round(percentile(values, 25) * 100) / 100,
    p50: Math.round(percentile(values, 50) * 100) / 100,
    p75: Math.round(percentile(values, 75) * 100) / 100,
    p95: Math.round(percentile(values, 95) * 100) / 100
  }
}

// ── FORMAT HELPERS ───────────────────────────────────────────

export function formatDuration(seconds) {
  var h = Math.floor(seconds / 3600)
  var m = Math.floor((seconds % 3600) / 60)
  var s = Math.round(seconds % 60)
  if (h > 0) return h + 'h ' + (m < 10 ? '0' : '') + m + 'm'
  if (m > 0) return m + 'm ' + (s < 10 ? '0' : '') + s + 's'
  return s + 's'
}

export function formatPace(speedKmh) {
  if (!speedKmh || speedKmh <= 0) return '--:--'
  var minPerKm = 60 / speedKmh
  var mins = Math.floor(minPerKm)
  var secs = Math.round((minPerKm - mins) * 60)
  return mins + ':' + (secs < 10 ? '0' : '') + secs
}

// ── FUNCTION REGISTRY (for agent sandbox) ────────────────────

export var FUNCTION_REGISTRY = {
  // Time slicing
  sliceByTime: { fn: sliceByTime, description: 'Slice points between start and end seconds. Args: (points, startSeconds, endSeconds)', category: 'slicing' },
  sliceByDistance: { fn: sliceByDistance, description: 'Slice points between start and end meters. Args: (points, startMeters, endMeters)', category: 'slicing' },
  resample: { fn: resample, description: 'Downsample points to target count. Args: (points, targetCount)', category: 'slicing' },
  resampleByInterval: { fn: resampleByInterval, description: 'Resample points at fixed time intervals. Args: (points, intervalSeconds)', category: 'slicing' },

  // Power
  normalizedPower: { fn: normalizedPower, description: 'Calculate Normalized Power (30s rolling avg, 4th power). Args: (points)', category: 'power' },
  averagePower: { fn: averagePower, description: 'Average power (excluding zeros). Args: (points)', category: 'power' },
  maxPower: { fn: maxPower, description: 'Maximum power in segment. Args: (points)', category: 'power' },
  intensityFactor: { fn: intensityFactor, description: 'Intensity Factor = NP/FTP. Args: (points, ftp)', category: 'power' },
  trainingStressScore: { fn: trainingStressScore, description: 'TSS from duration, NP, FTP. Args: (points, ftp)', category: 'power' },
  variabilityIndex: { fn: variabilityIndex, description: 'NP / Average Power ratio. Args: (points)', category: 'power' },
  efficiencyFactor: { fn: efficiencyFactor, description: 'NP / Average HR. Args: (points)', category: 'power' },
  bestPowerForDuration: { fn: bestPowerForDuration, description: 'Best average power over N seconds. Args: (points, durationSeconds)', category: 'power' },
  powerDurationCurve: { fn: powerDurationCurve, description: 'Best power at standard durations (1s to 1h). Args: (points)', category: 'power' },
  smoothPower: { fn: smoothPower, description: 'Add power_smooth field with rolling average. Args: (points, windowSeconds=30)', category: 'power' },
  wPrimeBalance: { fn: wPrimeBalance, description: "W' balance over time (Skiba model). Args: (points, {cp, wPrime})", category: 'power' },

  // Zones
  powerZones: { fn: powerZones, description: 'Coggan 7-zone boundaries for given FTP. Args: (ftp)', category: 'zones' },
  timeInPowerZones: { fn: timeInPowerZones, description: 'Time spent in each power zone. Args: (points, ftp)', category: 'zones' },
  hrZones: { fn: hrZones, description: 'Karvonen 5-zone HR boundaries. Args: (maxHR, restingHR)', category: 'zones' },
  timeInHRZones: { fn: timeInHRZones, description: 'Time spent in each HR zone. Args: (points, maxHR, restingHR)', category: 'zones' },

  // HR
  averageHeartRate: { fn: averageHeartRate, description: 'Average HR (excluding zeros). Args: (points)', category: 'hr' },
  maxHeartRate: { fn: maxHeartRate, description: 'Max HR in segment. Args: (points)', category: 'hr' },
  hrPowerDecoupling: { fn: hrPowerDecoupling, description: 'First half vs second half EF comparison (%). Args: (points)', category: 'hr' },

  // Cadence
  averageCadence: { fn: averageCadence, description: 'Average cadence (excluding zeros). Args: (points)', category: 'cadence' },
  cadenceDistribution: { fn: cadenceDistribution, description: 'Time in cadence buckets (60-70, 70-80, etc). Args: (points)', category: 'cadence' },

  // Detection
  detectClimbs: { fn: detectClimbs, description: 'Find climbs with gain, gradient, VAM, category. Args: (points, {minGain, minGradient})', category: 'detection' },
  detectIntervals: { fn: detectIntervals, description: 'Find hard efforts above FTP threshold. Args: (points, {ftp, minDuration, powerThreshold})', category: 'detection' },
  detectMatches: { fn: detectMatches, description: "Find anaerobic burns (>120% FTP) with W' cost. Args: (points, {ftp})", category: 'detection' },

  // Elevation / Gradient
  elevationProfile: { fn: elevationProfile, description: 'Total gain, loss, min/max altitude. Args: (points)', category: 'elevation' },
  gradientAtPoint: { fn: gradientAtPoint, description: 'Gradient % at index over windowMeters. Args: (points, index, windowMeters=100)', category: 'elevation' },
  gradientProfile: { fn: gradientProfile, description: 'Gradient per segment. Args: (points, segmentMeters=500)', category: 'elevation' },

  // Speed
  meanSpeed: { fn: meanSpeed, description: 'Average speed in km/h. Args: (points)', category: 'speed' },
  maxSpeed: { fn: maxSpeed, description: 'Max speed in km/h. Args: (points)', category: 'speed' },

  // Laps
  splitByDistance: { fn: splitByDistance, description: 'Split into laps by distance. Args: (points, splitMeters=1000)', category: 'laps' },
  splitByTime: { fn: splitByTime, description: 'Split into laps by time. Args: (points, splitSeconds=600)', category: 'laps' },

  // Analysis
  pedalingAnalysis: { fn: pedalingAnalysis, description: 'Pedaling vs coasting vs stopped time. Args: (points)', category: 'analysis' },
  activitySummary: { fn: activitySummary, description: 'Complete ride summary (power, HR, speed, elevation, TSS). Args: (points, {ftp})', category: 'analysis' },
  fieldStats: { fn: fieldStats, description: 'Statistics for any field (mean, std, percentiles). Args: (points, fieldName)', category: 'analysis' },

  // Format
  formatDuration: { fn: formatDuration, description: 'Format seconds as "1h 23m" or "45m 12s". Args: (seconds)', category: 'format' },
  formatPace: { fn: formatPace, description: 'Format speed as min/km pace. Args: (speedKmh)', category: 'format' }
}

// Get all function names grouped by category
export function listFunctions() {
  var categories = {}
  for (var name in FUNCTION_REGISTRY) {
    var entry = FUNCTION_REGISTRY[name]
    if (!categories[entry.category]) categories[entry.category] = []
    categories[entry.category].push({ name: name, description: entry.description })
  }
  return categories
}

// Get a human-readable manifest for the AI
export function functionManifest() {
  var lines = ['Available cycling analysis functions:\n']
  var cats = listFunctions()
  for (var cat in cats) {
    lines.push('## ' + cat.toUpperCase())
    for (var i = 0; i < cats[cat].length; i++) {
      lines.push('  ' + cats[cat][i].name + ' — ' + cats[cat][i].description)
    }
    lines.push('')
  }
  return lines.join('\n')
}
