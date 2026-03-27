// ─────────────────────────────────────────────────────────────
// AGENT SANDBOX — Safe execution environment for AI-generated code
// Exposes ActivityStore + cycling functions to generated code.
// The agent writes code that calls these functions by name.
// ─────────────────────────────────────────────────────────────

import { FUNCTION_REGISTRY, functionManifest } from './cycling-functions.js'
import store from './activity-store.js'

// ── SANDBOX CONTEXT BUILDER ──────────────────────────────────

function buildContext(overrides) {
  var ctx = {}

  // Inject all cycling functions (callable by name)
  // These still work — they take point-object arrays from points() or pointsInRange()
  for (var name in FUNCTION_REGISTRY) {
    ctx[name] = FUNCTION_REGISTRY[name].fn
  }

  // ── VECTOR API (primary — fast, simple) ──────────────────
  // vec("power") → Float32Array, array[i] = second i
  ctx.vec = function (field) { return store.vec(field) }
  // slice("power", 600, 900) → power from sec 600 to 900
  ctx.slice = function (field, start, end) { return store.slice(field, start, end) }
  // at("power", 3600) → power at 1 hour
  ctx.at = function (field, sec) { return store.at(field, sec) }
  // avg("power", 0, 300) → O(1) avg power first 5 min
  ctx.avg = function (field, start, end) { return store.avg(field, start, end) }
  // sum("power", 0, 300) → O(1) total joules
  ctx.sum = function (field, start, end) { return store.sum(field, start, end) }
  // max("power", 0, 3600) → max power in first hour
  ctx.max = function (field, start, end) { return store.max(field, start, end) }
  // min("heart_rate", 0, 3600) → min HR (skips zeros)
  ctx.min = function (field, start, end) { return store.min(field, start, end) }
  // np(0, 3600) → normalized power for first hour
  ctx.np = function (start, end) { return store.np(start, end) }
  // best("power", 300) → { value: 320, at: 1845 } best 5min power
  ctx.best = function (field, window, start, end) { return store.best(field, window, start, end) }
  // timeBucket(60) → precomputed 1-minute averages
  ctx.timeBucket = function (seconds) { return store.timeBucket(seconds) }
  // Duration in seconds
  ctx.duration = function () { var a = store.active(); return a ? a.duration : 0 }

  // ── POINT-OBJECT API (compatibility with cycling-functions.js) ──
  ctx.points = function () { return store.points() }
  ctx.pointsInRange = function (start, end) { return store.pointsInRange(start, end) }
  ctx.meta = function () { return store.meta() }
  ctx.summary = function (opts) { return store.summary(opts) }
  ctx.describe = function () { return store.describe() }
  ctx.store = store

  // Math helpers (safe)
  ctx.Math = Math
  ctx.JSON = { stringify: JSON.stringify, parse: JSON.parse }
  ctx.console = { log: sandboxLog, warn: sandboxLog, error: sandboxLog }
  ctx.Array = Array
  ctx.Object = Object
  ctx.Number = Number
  ctx.String = String
  ctx.Date = Date
  ctx.parseInt = parseInt
  ctx.parseFloat = parseFloat
  ctx.isNaN = isNaN
  ctx.isFinite = isFinite
  ctx.Infinity = Infinity
  ctx.NaN = NaN
  ctx.undefined = undefined
  ctx.null = null

  // Apply overrides (e.g., athlete config like FTP)
  if (overrides) {
    for (var k in overrides) ctx[k] = overrides[k]
  }

  return ctx
}

var _logs = []
function sandboxLog() {
  var args = []
  for (var i = 0; i < arguments.length; i++) {
    var v = arguments[i]
    args.push(typeof v === 'object' ? JSON.stringify(v) : String(v))
  }
  _logs.push(args.join(' '))
}

// ── EXECUTE CODE IN SANDBOX ──────────────────────────────────

export function execute(code, overrides) {
  _logs = []
  var ctx = buildContext(overrides)

  // Build parameter names and values for the Function constructor
  var paramNames = Object.keys(ctx)
  var paramValues = paramNames.map(function (k) { return ctx[k] })

  var startTime = Date.now()
  var result, error

  try {
    // Wrap code to capture return value
    // The code can either:
    // 1. Return a value directly: "return activitySummary(points())"
    // 2. Assign to __result: "__result = detectClimbs(points())"
    // 3. Be a multi-statement block that returns at the end

    var wrappedCode = '"use strict";\nvar __result = undefined;\n' + code +
      '\nif (typeof __result !== "undefined") return __result;'

    var fn = new Function(paramNames.join(','), wrappedCode)
    result = fn.apply(null, paramValues)
  } catch (e) {
    error = {
      message: e.message,
      type: e.constructor.name,
      stack: e.stack ? e.stack.split('\n').slice(0, 3).join('\n') : null
    }
  }

  var elapsed = Date.now() - startTime

  return {
    success: !error,
    result: result,
    error: error,
    logs: _logs.slice(),
    elapsed_ms: elapsed
  }
}

// ── EXECUTE WITH CHART OUTPUT ────────────────────────────────
// For the code agent pipeline: execute extraction_code + metrics_code

export function executeVisualization(extractionCode, metricsCode, chartConfig, overrides) {
  var dataResult = execute(
    'var data = points();\n' + extractionCode + '\nreturn __extracted;',
    overrides
  )

  var metricsResult = null
  if (metricsCode) {
    metricsResult = execute(
      'var data = points();\n' + metricsCode + '\nreturn __metrics;',
      overrides
    )
  }

  return {
    data: dataResult.success ? dataResult.result : null,
    metrics: metricsResult && metricsResult.success ? metricsResult.result : null,
    chart_config: chartConfig,
    errors: [
      dataResult.error ? { phase: 'extraction', error: dataResult.error } : null,
      metricsResult && metricsResult.error ? { phase: 'metrics', error: metricsResult.error } : null
    ].filter(Boolean),
    logs: dataResult.logs.concat(metricsResult ? metricsResult.logs : [])
  }
}

// ── AGENT SYSTEM PROMPT BUILDER ──────────────────────────────
// Generates the system prompt section that tells the AI what functions
// are available and how to use them

export function buildAgentPrompt(athleteConfig) {
  var cfg = athleteConfig || {}
  var activity = store.active()
  var desc = store.describe()

  var ftp = cfg.ftp || 250
  var dur = activity ? activity.duration : 0

  var prompt = [
    '# CYCLING ANALYSIS SANDBOX',
    '',
    'The activity is stored as 1Hz vectors (typed arrays).',
    'array[i] = value at second i. No parsing needed.',
    '',
    '## ACTIVITY',
    desc || 'No activity loaded.',
    ''
  ]

  if (cfg.ftp) prompt.push('FTP: ' + cfg.ftp + 'W')
  if (cfg.weight) prompt.push('Weight: ' + cfg.weight + 'kg')
  if (cfg.maxHR) prompt.push('Max HR: ' + cfg.maxHR)
  if (cfg.restingHR) prompt.push('Resting HR: ' + cfg.restingHR)
  prompt.push('')

  // Show sample values so the AI knows the ranges
  if (activity) {
    var v = activity.v
    var mid = Math.floor(dur / 2)
    prompt.push('## SAMPLE VALUES (second 0 / ' + mid + ' / ' + dur + ')')
    var sampleFields = ['power', 'heart_rate', 'cadence', 'speed', 'altitude', 'gradient']
    for (var i = 0; i < sampleFields.length; i++) {
      var f = sampleFields[i]
      if (v[f][0] || v[f][mid] || v[f][dur]) {
        prompt.push('  ' + f + ': ' + Math.round(v[f][0]) + ' / ' + Math.round(v[f][mid]) + ' / ' + Math.round(v[f][dur]))
      }
    }
    prompt.push('')
  }

  prompt.push('## VECTOR API (primary — use this)')
  prompt.push('')
  prompt.push('Fields: "power", "heart_rate", "cadence", "speed", "altitude", "distance", "latitude", "longitude", "temperature", "gradient"')
  prompt.push('')
  prompt.push('  vec(field)             → Float32Array, vec("power")[3600] = power at 1hr')
  prompt.push('  slice(field, s, e)     → vec("power").slice(s, e) equivalent')
  prompt.push('  at(field, sec)         → single value at that second')
  prompt.push('  avg(field, s, e)       → O(1) average via prefix sums')
  prompt.push('  sum(field, s, e)       → O(1) sum')
  prompt.push('  max(field, s, e)       → max in range')
  prompt.push('  min(field, s, e)       → min in range (skips zeros)')
  prompt.push('  np(s, e)              → normalized power for range')
  prompt.push('  best(field, window)    → {value, at} best N-sec avg. best("power", 300) = best 5min')
  prompt.push('  best(field, w, s, e)   → best N-sec avg within [s, e)')
  prompt.push('  duration()            → total seconds (' + dur + ')')
  prompt.push('  timeBucket(secs)      → [{start, time_label, power_avg, hr_avg, ...}] precomputed at 60/300')
  prompt.push('  summary(opts)         → full ride summary')
  prompt.push('  meta()               → metadata')
  prompt.push('')

  prompt.push('## DOMAIN FUNCTIONS (for complex analysis)')
  prompt.push('These take point-object arrays. Use points() or pointsInRange(start, end) to get them.')
  prompt.push('')
  prompt.push(functionManifest())
  prompt.push('')

  prompt.push('## CODE RULES')
  prompt.push('- ES5 only (var, function — no const/let/=>/template literals)')
  prompt.push('- No imports, no DOM, no fetch')
  prompt.push('- Return result OR assign __result, __extracted (chart data), __metrics')
  prompt.push('- Keep chart arrays under 500 items')
  prompt.push('- PREFER vec/avg/best/slice for simple queries — less code, faster')
  prompt.push('- Use domain functions (detectClimbs, wPrimeBalance, etc.) for complex analysis')
  prompt.push('')

  prompt.push('## EXAMPLES')
  prompt.push('')
  prompt.push('// Avg power first 20 minutes')
  prompt.push('return Math.round(avg("power", 0, 1200))')
  prompt.push('')
  prompt.push('// Best 5min power')
  prompt.push('return best("power", 300)')
  prompt.push('')
  prompt.push('// NP for the whole ride')
  prompt.push('return Math.round(np(0, duration()))')
  prompt.push('')
  prompt.push('// Compare first half vs second half power')
  prompt.push('var d = duration()')
  prompt.push('var half = Math.floor(d / 2)')
  prompt.push('return {')
  prompt.push('  first_half: Math.round(avg("power", 0, half)),')
  prompt.push('  second_half: Math.round(avg("power", half, d)),')
  prompt.push('  np_first: Math.round(np(0, half)),')
  prompt.push('  np_second: Math.round(np(half, d))')
  prompt.push('}')
  prompt.push('')
  prompt.push('// Chart: 1-minute power + HR')
  prompt.push('__extracted = timeBucket(60)')
  prompt.push('')
  prompt.push('// Chart: power over time (every 10s for ~' + Math.round(dur / 10) + ' points)')
  prompt.push('var p = vec("power")')
  prompt.push('var result = []')
  prompt.push('for (var i = 0; i < p.length; i += 10) {')
  prompt.push('  result.push({ time: formatDuration(i), power: Math.round(p[i]), hr: Math.round(vec("heart_rate")[i]) })')
  prompt.push('}')
  prompt.push('__extracted = result')
  prompt.push('')
  prompt.push('// Climb detection')
  prompt.push('return detectClimbs(points(), { minGain: 50, minGradient: 3 })')
  prompt.push('')
  prompt.push("// W' balance")
  prompt.push('return wPrimeBalance(points(), { cp: ' + ftp + ', wPrime: ' + (cfg.wPrime || 20000) + ' })')
  prompt.push('')
  prompt.push('// Power by gradient bucket')
  prompt.push('var g = vec("gradient")')
  prompt.push('var p = vec("power")')
  prompt.push('var buckets = {}')
  prompt.push('for (var i = 0; i < g.length; i++) {')
  prompt.push('  if (p[i] <= 0) continue')
  prompt.push('  var key = Math.floor(g[i] / 2) * 2')
  prompt.push('  if (!buckets[key]) buckets[key] = { sum: 0, count: 0 }')
  prompt.push('  buckets[key].sum += p[i]')
  prompt.push('  buckets[key].count++')
  prompt.push('}')
  prompt.push('return Object.keys(buckets).sort(function(a,b){return a-b}).map(function(k) {')
  prompt.push('  return { gradient: k + "%", avg_power: Math.round(buckets[k].sum / buckets[k].count), seconds: buckets[k].count }')
  prompt.push('})')

  return prompt.join('\n')
}

// ── FUNCTION CATALOG FOR TOOL CALLING ────────────────────────
// Returns function definitions in a format suitable for Claude tool_use

export function toolDefinitions() {
  var tools = []

  for (var name in FUNCTION_REGISTRY) {
    var entry = FUNCTION_REGISTRY[name]
    tools.push({
      name: 'cycling_' + name,
      description: entry.description,
      category: entry.category,
      input_schema: {
        type: 'object',
        properties: {
          args: {
            type: 'string',
            description: 'JSON-encoded arguments array for this function'
          }
        }
      }
    })
  }

  return tools
}

// Execute a tool call by name
export function executeTool(toolName, argsJson) {
  var name = toolName.replace('cycling_', '')
  var entry = FUNCTION_REGISTRY[name]
  if (!entry) return { error: 'Unknown function: ' + name }

  try {
    var args = argsJson ? JSON.parse(argsJson) : []
    // If first arg should be points, inject them
    if (entry.description.indexOf('Args: (points') === 0 ||
        entry.description.indexOf('Args: (points,') >= 0) {
      if (!Array.isArray(args[0])) {
        args.unshift(store.points())
      }
    }
    var result = entry.fn.apply(null, args)
    return { success: true, result: result }
  } catch (e) {
    return { error: e.message }
  }
}

export default { execute, executeVisualization, buildAgentPrompt, toolDefinitions, executeTool }
