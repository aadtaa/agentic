import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  LineChart, BarChart, AreaChart, ScatterChart, ComposedChart,
  Line, Bar, Area, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush,
  ReferenceLine, ResponsiveContainer
} from 'recharts'

import store from '../../lib/activity-store.js'
import { execute, buildAgentPrompt } from '../../lib/agent-sandbox.js'
import { FUNCTION_REGISTRY, functionManifest, formatDuration } from '../../lib/cycling-functions.js'

// ─────────────────────────────────────────────
// FILE PARSERS (from CodeAgentTwo — reused)
// ─────────────────────────────────────────────

function xmlText(parent, tagName) {
  const el = parent.getElementsByTagName(tagName)[0]
    || parent.getElementsByTagNameNS('*', tagName)[0]
  return el ? el.textContent : null
}

function parseTCX(text) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')
  const points = []
  const tps = doc.getElementsByTagName('Trackpoint')
  let startTime = null

  for (let i = 0; i < tps.length; i++) {
    const tp = tps[i]
    const time = xmlText(tp, 'Time')
    if (!startTime && time) startTime = new Date(time)

    const lat = xmlText(tp, 'LatitudeDegrees')
    const lon = xmlText(tp, 'LongitudeDegrees')
    const alt = xmlText(tp, 'AltitudeMeters')
    const dist = xmlText(tp, 'DistanceMeters')
    const cad = xmlText(tp, 'Cadence')

    const hrBpm = tp.getElementsByTagName('HeartRateBpm')[0]
      || tp.getElementsByTagNameNS('*', 'HeartRateBpm')[0]
    const hr = hrBpm ? xmlText(hrBpm, 'Value') : null

    const watts = xmlText(tp, 'Watts')
    const speed = xmlText(tp, 'Speed')
    const power = watts || xmlText(tp, 'Power')

    const pt = {}
    if (time && startTime) pt.elapsed_seconds = (new Date(time) - startTime) / 1000
    if (time) pt.timestamp = time
    if (lat) pt.latitude = parseFloat(lat)
    if (lon) pt.longitude = parseFloat(lon)
    if (alt) pt.altitude = parseFloat(alt)
    if (dist) pt.distance_meters = parseFloat(dist)
    if (hr) pt.heart_rate = parseInt(hr)
    if (cad) pt.cadence = parseInt(cad)
    if (speed) pt.speed = parseFloat(speed)
    if (power) pt.power = parseInt(power)

    if (Object.keys(pt).length > 0) points.push(pt)
  }
  return points
}

function parseGPX(text) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')
  const points = []
  const trkpts = doc.getElementsByTagName('trkpt')
  let startTime = null

  for (let i = 0; i < trkpts.length; i++) {
    const tp = trkpts[i]
    const lat = tp.getAttribute('lat')
    const lon = tp.getAttribute('lon')
    const ele = tp.getElementsByTagName('ele')[0]?.textContent
    const time = tp.getElementsByTagName('time')[0]?.textContent
    const hr = tp.getElementsByTagName('hr')[0]?.textContent
    const cad = tp.getElementsByTagName('cad')[0]?.textContent
    const power = tp.getElementsByTagName('power')[0]?.textContent

    if (!startTime && time) startTime = new Date(time)

    const pt = {}
    if (time && startTime) pt.elapsed_seconds = (new Date(time) - startTime) / 1000
    if (time) pt.timestamp = time
    if (lat) pt.latitude = parseFloat(lat)
    if (lon) pt.longitude = parseFloat(lon)
    if (ele) pt.altitude = parseFloat(ele)
    if (hr) pt.heart_rate = parseInt(hr)
    if (cad) pt.cadence = parseInt(cad)
    if (power) pt.power = parseInt(power)

    if (Object.keys(pt).length > 0) points.push(pt)
  }
  return points
}

function parseFIT(buffer) {
  const view = new DataView(buffer)
  const points = []
  let offset = 0

  try {
    const headerSize = view.getUint8(0)
    offset = headerSize
    const definitions = {}
    let startTimestamp = null

    while (offset < buffer.byteLength - 2) {
      const recordHeader = view.getUint8(offset)
      offset++

      const isDefinition = (recordHeader & 0x40) !== 0
      const localType = recordHeader & 0x0F

      if (isDefinition) {
        offset++
        const arch = view.getUint8(offset); offset++
        const isLittleEndian = arch === 0
        const globalMsgNum = isLittleEndian
          ? view.getUint16(offset, true)
          : view.getUint16(offset, false)
        offset += 2
        const numFields = view.getUint8(offset); offset++

        const fields = []
        for (let f = 0; f < numFields; f++) {
          const fieldDef = view.getUint8(offset); offset++
          const size = view.getUint8(offset); offset++
          const baseType = view.getUint8(offset); offset++
          fields.push({ fieldDef, size, baseType })
        }

        definitions[localType] = { globalMsgNum, fields, isLittleEndian }
      } else {
        const def = definitions[localType]
        if (!def) break

        const record = {}
        for (const field of def.fields) {
          const val = readFITField(view, offset, field, def.isLittleEndian)
          offset += field.size

          if (val === null || val === undefined) continue

          if (def.globalMsgNum === 20) {
            switch (field.fieldDef) {
              case 253:
                record.timestamp_raw = val
                if (!startTimestamp) startTimestamp = val
                record.elapsed_seconds = val - startTimestamp
                break
              case 0: record.latitude = val * (180 / Math.pow(2, 31)); break
              case 1: record.longitude = val * (180 / Math.pow(2, 31)); break
              case 2: record.altitude = val / 5 - 500; break
              case 3: record.heart_rate = val; break
              case 4: record.cadence = val; break
              case 5: record.distance_meters = val / 100; break
              case 6: record.speed = val / 1000; break
              case 7: record.power = val; break
              case 13: record.temperature = val; break
            }
          }
        }

        if (def.globalMsgNum === 20 && Object.keys(record).length > 1) {
          points.push(record)
        }
      }
    }
  } catch (e) {
    console.warn('[FIT parser] Partial parse:', e.message, '— got', points.length, 'points')
  }

  return points
}

function readFITField(view, offset, field, littleEndian) {
  try {
    const baseType = field.baseType & 0x1F
    switch (baseType) {
      case 0: return view.getUint8(offset)
      case 1: return view.getInt8(offset)
      case 2: return view.getUint8(offset)
      case 3: return view.getInt16(offset, littleEndian)
      case 4: return view.getUint16(offset, littleEndian)
      case 5: return view.getInt32(offset, littleEndian)
      case 6: return view.getUint32(offset, littleEndian)
      case 7: return null
      case 8: return view.getFloat32(offset, littleEndian)
      case 9: return view.getFloat64(offset, littleEndian)
      case 10: return view.getUint8(offset)
      case 11: return view.getUint16(offset, littleEndian)
      case 12: return view.getUint32(offset, littleEndian)
      case 13: return null
      case 14: return view.getInt64 ? Number(view.getBigInt64(offset, littleEndian)) : null
      case 15: return view.getUint64 ? Number(view.getBigUint64(offset, littleEndian)) : null
      case 16: return view.getUint64 ? Number(view.getBigUint64(offset, littleEndian)) : null
      default: return null
    }
  } catch (e) {
    return null
  }
}

// ─────────────────────────────────────────────
// DYNAMIC CHART (reused from CodeAgentTwo)
// ─────────────────────────────────────────────

const DynamicChart = ({ data, config }) => {
  if (!data || !config || data.length === 0) return null

  const chartComponents = {
    line: LineChart, bar: BarChart, area: AreaChart,
    scatter: ScatterChart, composed: ComposedChart
  }
  const seriesComponents = {
    line: Line, bar: Bar, area: Area, scatter: Scatter
  }

  const ChartComponent = chartComponents[config.type] || ComposedChart
  const series = config.series || []
  const hasRightAxis = series.some(s => s.yAxisId === 'right')

  return (
    <div style={{
      backgroundColor: 'var(--grey-50, #f8f8fa)',
      borderRadius: '12px', padding: '16px', marginTop: '12px',
    }}>
      {config.title && (
        <div style={{
          fontSize: '14px', fontWeight: 600,
          color: 'var(--text-primary)', marginBottom: '12px'
        }}>
          {config.title}
        </div>
      )}

      <ResponsiveContainer width="100%" height={320}>
        <ChartComponent data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          {config.grid !== false && <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200, #eee)" />}

          <XAxis
            dataKey={config.xKey}
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            label={config.xLabel ? { value: config.xLabel, position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: 'var(--text-secondary)' } } : undefined}
          />

          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            label={config.yLabel ? { value: config.yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--text-secondary)' } } : undefined}
          />

          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              label={config.yLabelRight ? { value: config.yLabelRight, angle: 90, position: 'insideRight', style: { fontSize: 11, fill: 'var(--text-secondary)' } } : undefined}
            />
          )}

          {config.tooltip !== false && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-primary, #fff)',
                border: '1px solid var(--grey-200, #eee)',
                borderRadius: '8px', fontSize: '12px'
              }}
            />
          )}

          {config.legend && <Legend wrapperStyle={{ fontSize: '12px' }} />}

          {(config.referenceLines || []).map((rl, i) => (
            <ReferenceLine
              key={i} y={rl.y} x={rl.x}
              yAxisId={rl.yAxisId || 'left'}
              label={{ value: rl.label, position: 'right', style: { fontSize: 11, fill: rl.color || '#999' } }}
              stroke={rl.color || '#999'}
              strokeDasharray={rl.strokeDasharray || '5 5'}
            />
          ))}

          {series.map((s, i) => {
            const seriesType = config.type === 'composed' ? (s.type || 'line') : config.type
            const SeriesComp = seriesComponents[seriesType] || Line
            const props = {
              key: i, dataKey: s.key,
              name: s.label || s.key,
              yAxisId: s.yAxisId || 'left',
              stroke: s.color || `hsl(${i * 60 + 210}, 70%, 55%)`,
              fill: s.color || `hsl(${i * 60 + 210}, 70%, 55%)`,
              strokeWidth: s.strokeWidth || 2,
              dot: s.dot !== undefined ? s.dot : false,
              type: 'monotone'
            }
            if (seriesType === 'area') props.fillOpacity = s.fillOpacity || 0.15
            if (seriesType === 'bar') props.fillOpacity = s.fillOpacity || 0.8
            return <SeriesComp {...props} />
          })}

          {config.brush && (
            <Brush dataKey={config.xKey} height={30} stroke="var(--accent-primary)" />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────
// METRICS DISPLAY
// ─────────────────────────────────────────────

const MetricsDisplay = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null

  return (
    <div style={{
      display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px',
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          backgroundColor: 'var(--grey-50, #f8f8fa)',
          borderRadius: '10px', padding: '12px 16px', minWidth: '120px',
        }}>
          <div style={{
            fontSize: '11px', color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px',
          }}>
            {m.label}
          </div>
          <div style={{
            fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)',
          }}>
            {typeof m.value === 'number' ? Math.round(m.value * 10) / 10 : m.value}
            {m.unit && (
              <span style={{
                fontSize: '12px', fontWeight: 400,
                color: 'var(--text-secondary)', marginLeft: '4px',
              }}>
                {m.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// SANDBOX RESULT DISPLAY
// ─────────────────────────────────────────────

const SandboxResult = ({ result }) => {
  if (!result) return null

  const { success, data, error, logs, elapsed_ms } = result

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Logs */}
      {logs && logs.length > 0 && (
        <div style={{
          backgroundColor: '#1a1a2e', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '8px',
          fontFamily: 'monospace', fontSize: '12px', color: '#a0a0c0',
          maxHeight: '120px', overflowY: 'auto',
        }}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: '#FEF2F2', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '8px',
          fontSize: '13px', color: '#DC2626',
          borderLeft: '3px solid #DC2626',
        }}>
          <strong>{error.type}:</strong> {error.message}
        </div>
      )}

      {/* Execution time */}
      {elapsed_ms != null && (
        <span style={{
          fontSize: '11px', padding: '2px 8px',
          backgroundColor: 'var(--grey-100)', borderRadius: '8px',
          color: 'var(--text-tertiary)',
        }}>
          {elapsed_ms}ms
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// FUNCTION EXPLORER PANEL
// ─────────────────────────────────────────────

const FunctionExplorer = ({ onRunFunction }) => {
  const [expanded, setExpanded] = useState(false)
  const [selectedFn, setSelectedFn] = useState(null)

  const categories = {}
  for (const name in FUNCTION_REGISTRY) {
    const entry = FUNCTION_REGISTRY[name]
    if (!categories[entry.category]) categories[entry.category] = []
    categories[entry.category].push({ name, ...entry })
  }

  return (
    <div style={{
      backgroundColor: 'var(--grey-50, #f8f8fa)',
      borderRadius: '12px', padding: '12px 16px', marginBottom: '12px',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          fontFamily: 'inherit',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 5L3 8L6 11" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 5L13 8L10 11" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Function Library ({Object.keys(FUNCTION_REGISTRY).length} functions)
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{
            marginLeft: 'auto',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <path d="M3 5L6 8L9 5" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {expanded && (
        <div style={{ marginTop: '12px' }}>
          {Object.entries(categories).map(([cat, fns]) => (
            <div key={cat} style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
              }}>
                {cat}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {fns.map(fn => (
                  <button
                    key={fn.name}
                    onClick={() => {
                      setSelectedFn(selectedFn === fn.name ? null : fn.name)
                      if (onRunFunction) onRunFunction(fn.name)
                    }}
                    title={fn.description}
                    style={{
                      padding: '4px 10px', borderRadius: '6px',
                      border: '1px solid var(--grey-200)',
                      backgroundColor: selectedFn === fn.name ? 'var(--accent-primary)' : 'white',
                      color: selectedFn === fn.name ? 'white' : 'var(--text-primary)',
                      fontSize: '12px', fontFamily: 'monospace', cursor: 'pointer',
                    }}
                  >
                    {fn.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// ACTIVITY INFO BAR (enhanced from FileInfoBar)
// ─────────────────────────────────────────────

const ActivityInfoBar = ({ onRemove }) => {
  const meta = store.meta()
  if (!meta) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '8px 16px',
      backgroundColor: 'var(--grey-50, #f8f8fa)',
      borderRadius: '10px', marginBottom: '12px', fontSize: '13px',
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 2H10L13 5V14H4C3.44772 14 3 13.5523 3 13V3C3 2.44772 3.44772 2 4 2Z" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 2V5H13" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{meta.name}</span>
        <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>
          {meta.point_count.toLocaleString()} pts
          {meta.duration_seconds > 0 && ` / ${formatDuration(meta.duration_seconds)}`}
          {meta.total_distance > 0 && ` / ${(meta.total_distance / 1000).toFixed(1)}km`}
        </span>
        <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px', fontSize: '11px' }}>
          [{meta.fields.filter(f => f !== 'elapsed_seconds' && f !== 'timestamp').join(', ')}]
        </span>
      </div>
      {/* Loaded indicator */}
      <span style={{
        fontSize: '11px', padding: '2px 8px',
        backgroundColor: '#DCFCE7', borderRadius: '8px', color: '#16A34A',
      }}>
        In Store
      </span>
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

const UniversalAgent = () => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [activityLoaded, setActivityLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [athleteConfig, setAthleteConfig] = useState({ ftp: 250, weight: 75, maxHR: 190, restingHR: 50 })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  const quickActions = [
    { label: "Ride Summary", prompt: "Give me a complete summary of this ride" },
    { label: "Find Climbs", prompt: "Detect and analyze all climbs in this ride" },
    { label: "Power Zones", prompt: "Show time spent in each power zone" },
    { label: "Best Efforts", prompt: "Find my best 1min, 5min, and 20min power efforts" },
    { label: "HR vs Power", prompt: "Analyze the relationship between heart rate and power, including decoupling" },
    { label: "Intervals", prompt: "Detect all hard intervals and show their metrics" },
    { label: "W' Balance", prompt: "Show my W' balance over the ride — when was I closest to empty?" },
    { label: "Pacing", prompt: "Analyze my pacing — was I even or did I fade?" },
    { label: "Cadence", prompt: "Analyze my cadence patterns and distribution" },
    { label: "Gradient vs Power", prompt: "How did my power respond to gradient changes?" },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ─── FILE HANDLING ─────────────────────────────────

  const processFile = useCallback(async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()

    try {
      let points

      if (ext === 'fit') {
        const buffer = await file.arrayBuffer()
        points = parseFIT(buffer)
      } else if (ext === 'tcx') {
        const text = await file.text()
        points = parseTCX(text)
      } else if (ext === 'gpx') {
        const text = await file.text()
        points = parseGPX(text)
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Unsupported file format: .${ext}. Please upload a FIT, TCX, or GPX file.`
        }])
        return
      }

      if (!points || points.length === 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Could not parse any data points from "${file.name}". The file may be corrupted or empty.`
        }])
        return
      }

      // Load into ActivityStore
      const meta = store.load(file.name, points, {
        name: file.name,
        format: ext,
        source: 'file_upload'
      })

      setActivityLoaded(true)

      // Run instant summary
      const summaryResult = execute('return summary({ ftp: ' + athleteConfig.ftp + ' })', athleteConfig)
      const sum = summaryResult.success ? summaryResult.result : null

      let summaryText = `**Activity loaded: ${file.name}**\n\n`
      summaryText += `${meta.point_count.toLocaleString()} data points at ${meta.sample_rate_hz.toFixed(1)} Hz\n`
      summaryText += `**Duration:** ${formatDuration(meta.duration_seconds)}\n`
      summaryText += `**Distance:** ${(meta.total_distance / 1000).toFixed(1)} km\n`
      summaryText += `**Fields:** ${meta.fields.join(', ')}\n\n`

      if (sum) {
        summaryText += `**Quick stats:** `
        if (sum.avg_power) summaryText += `Avg ${sum.avg_power}W / NP ${sum.normalized_power}W`
        if (sum.avg_hr) summaryText += ` | Avg HR ${sum.avg_hr}`
        if (sum.elevation_gain) summaryText += ` | Elev ${sum.elevation_gain}m`
        if (sum.tss) summaryText += ` | TSS ${sum.tss}`
        summaryText += '\n'
      }

      summaryText += '\nThe activity is loaded in the sandbox. Ask me anything — climbs, intervals, power zones, W\' balance, pacing analysis, or any custom query.'

      setMessages(prev => [...prev, { role: 'assistant', content: summaryText }])
    } catch (err) {
      console.error('File parse error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error parsing "${file.name}": ${err.message}`
      }])
    }
  }, [athleteConfig])

  const handleFileDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  const removeActivity = useCallback(() => {
    if (store.activeId) store.remove(store.activeId)
    setActivityLoaded(false)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Activity removed. Upload a new file to continue.'
    }])
  }, [])

  // ─── DIRECT FUNCTION EXECUTION ──────────────────────

  const runFunction = useCallback((fnName) => {
    if (!activityLoaded) return
    const entry = FUNCTION_REGISTRY[fnName]
    if (!entry) return

    // Auto-run simple functions that just need points()
    const needsPointsOnly = entry.description.match(/^.*Args: \(points\)$/)
    if (needsPointsOnly) {
      const result = execute('return ' + fnName + '(points())', athleteConfig)
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'sandbox_result',
        fnName,
        result,
        content: `**${fnName}()** executed`
      }])
    }
  }, [activityLoaded, athleteConfig])

  // ─── MESSAGE SENDING ──────────────────────────────

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: messageText }])
    setIsLoading(true)

    try {
      if (!activityLoaded) {
        // Chat-only mode
        setLoadingStage('Thinking...')
        const response = await fetch('/.netlify/functions/code-agent-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText, history: [], mode: 'chat' })
        })
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.error || 'No response.' }])
        return
      }

      // ─── SANDBOX-POWERED ANALYSIS ────────────────────
      setLoadingStage('Planning analysis...')

      const agentPrompt = buildAgentPrompt(athleteConfig)

      // Build conversation history for context
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content).slice(0, 500)
      }))

      const response = await fetch('/.netlify/functions/code-agent-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history,
          sandboxPrompt: agentPrompt,
          dataSummary: { point_count: store.meta().point_count, fields: store.meta().fields },
          mode: 'sandbox'
        })
      })

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
        // SSE streaming response
        const planMsgKey = Date.now()
        setMessages(prev => [...prev, {
          role: 'assistant',
          type: 'plan',
          planText: '',
          _key: planMsgKey,
          isGenerating: true,
          isThinking: true,
          thinkingMs: null,
        }])
        setLoadingStage('')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = ''
        let resultData = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          sseBuffer += decoder.decode(value, { stream: true })
          const parts = sseBuffer.split('\n\n')
          sseBuffer = parts.pop()

          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6)
            if (payload === '[DONE]') continue
            try {
              const evt = JSON.parse(payload)
              if (evt.type === 'thinking_done') {
                setMessages(prev => prev.map(m =>
                  m._key === planMsgKey
                    ? { ...m, isThinking: false, thinkingMs: evt.thinking_ms }
                    : m
                ))
              } else if (evt.type === 'plan_delta') {
                setMessages(prev => prev.map(m =>
                  m._key === planMsgKey
                    ? { ...m, planText: m.planText + evt.text }
                    : m
                ))
              } else if (evt.type === 'plan_done') {
                setLoadingStage('Generating code...')
              } else if (evt.type === 'result') {
                resultData = evt.data
              } else if (evt.type === 'error') {
                setMessages(prev => prev.map(m =>
                  m._key === planMsgKey ? { ...m, isGenerating: false } : m
                ))
                setMessages(prev => [...prev, { role: 'assistant', content: evt.message }])
                return
              }
            } catch (_) {}
          }
        }

        if (resultData) {
          // Execute in our enhanced sandbox
          setLoadingStage('Executing in sandbox...')
          const execStart = Date.now()

          const extractionResult = execute(
            resultData.extraction_code || '',
            athleteConfig
          )

          let metrics = []
          if (resultData.metrics_code) {
            const metricsResult = execute(resultData.metrics_code, athleteConfig)
            if (metricsResult.success) metrics = metricsResult.result
          }

          const executionMs = Date.now() - execStart

          setMessages(prev => prev.map(m =>
            m._key === planMsgKey
              ? {
                  ...m,
                  type: 'visualization',
                  isGenerating: false,
                  chartData: extractionResult.success ? extractionResult.result : null,
                  chartConfig: resultData.chart_config,
                  metrics,
                  insight: resultData.insight,
                  sandboxLogs: extractionResult.logs,
                  sandboxError: extractionResult.error,
                  timing: {
                    opus_ms: resultData.timing?.opus_ms,
                    thinking_ms: resultData.timing?.thinking_ms,
                    generation_ms: resultData.timing?.generation_ms,
                    execution_ms: executionMs,
                    total_ms: (resultData.timing?.opus_ms || 0) + executionMs
                  }
                }
              : m
          ))
        } else {
          setMessages(prev => prev.map(m =>
            m._key === planMsgKey ? { ...m, isGenerating: false } : m
          ))
          setMessages(prev => [...prev, {
            role: 'assistant', content: 'Stream ended without a result. Please try again.'
          }])
        }
      } else {
        // JSON response (non-streaming fallback)
        const data = await response.json()

        if (data.extraction_code || data.code) {
          const code = data.extraction_code || data.code
          setLoadingStage('Executing in sandbox...')
          const result = execute(code, athleteConfig)

          if (result.success && Array.isArray(result.result)) {
            // Chart data
            let metrics = []
            if (data.metrics_code) {
              const mr = execute(data.metrics_code, athleteConfig)
              if (mr.success) metrics = mr.result
            }

            setMessages(prev => [...prev, {
              role: 'assistant',
              type: 'visualization',
              planText: data.plan || data.user_facing_plan || '',
              chartData: result.result,
              chartConfig: data.chart_config,
              metrics,
              insight: data.insight || data.response,
              sandboxLogs: result.logs,
            }])
          } else if (result.success) {
            // Non-chart result (object, number, etc)
            const formatted = typeof result.result === 'object'
              ? '```json\n' + JSON.stringify(result.result, null, 2) + '\n```'
              : String(result.result)

            setMessages(prev => [...prev, {
              role: 'assistant',
              content: (data.response || data.insight || '') + '\n\n' + formatted,
              sandboxLogs: result.logs,
            }])
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Sandbox error: ${result.error.message}\n\n${data.response || ''}`,
              sandboxLogs: result.logs,
            }])
          }
        } else if (data.response || data.error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.response || data.error
          }])
        }
      }
    } catch (error) {
      console.error('Universal agent error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Unable to connect. Please check your connection and try again.'
      }])
    } finally {
      setIsLoading(false)
      setLoadingStage('')
    }
  }

  const handleSend = () => {
    if (!inputValue.trim()) return
    const message = inputValue.trim()
    setInputValue('')
    sendMessage(message)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasMessages = messages.length > 0

  // ─── RENDER ────────────────────────────────────────

  return (
    <div
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleFileDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(47, 113, 255, 0.08)',
          border: '2px dashed var(--accent-primary)',
          borderRadius: '12px', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '18px', fontWeight: 500, color: 'var(--accent-primary)',
          }}>
            Drop your FIT, TCX, or GPX file here
          </div>
        </div>
      )}

      {/* Chat Content */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          maxWidth: '760px', width: '100%', margin: '0 auto',
          padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column',
        }}>
          {hasMessages ? (
            <div style={{ flex: 1 }}>
              {messages.map((msg, idx) => (
                <div key={idx}>
                  {msg.role === 'user' ? (
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end', marginBottom: '24px',
                    }}>
                      <div style={{
                        backgroundColor: 'var(--grey-100)',
                        borderRadius: '20px', padding: '12px 20px',
                        fontSize: '15px', color: 'var(--text-primary)', maxWidth: '80%',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : msg.type === 'plan' ? (
                    <div style={{ marginBottom: '24px' }}>
                      {msg.isThinking && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '14px 20px',
                          backgroundColor: 'var(--grey-50, #f8f8fa)',
                          borderRadius: '12px',
                          borderLeft: '3px solid #7C3AED',
                        }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {[0, 0.2, 0.4].map(delay => (
                              <div key={delay} style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                backgroundColor: '#7C3AED',
                                animation: `thinkingPulse 1.4s ease-in-out ${delay}s infinite`,
                              }} />
                            ))}
                          </div>
                          <span style={{
                            fontSize: '13px', color: '#7C3AED', fontWeight: 500,
                          }}>
                            Reasoning deeply...
                          </span>
                        </div>
                      )}

                      {!msg.isThinking && (
                        <div style={{
                          backgroundColor: 'var(--grey-50, #f8f8fa)',
                          borderRadius: '12px', padding: '16px 20px',
                          borderLeft: '3px solid #28CD56',
                        }}>
                          <div style={{
                            fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)',
                          }}>
                            {msg.planText}
                            {msg.isGenerating && (
                              <span style={{
                                display: 'inline-block',
                                width: '6px', height: '16px',
                                backgroundColor: '#28CD56',
                                marginLeft: '2px',
                                verticalAlign: 'text-bottom',
                                animation: 'cursorBlink 0.8s ease-in-out infinite',
                              }} />
                            )}
                          </div>
                        </div>
                      )}

                      {msg.isGenerating && !msg.isThinking && loadingStage && (
                        <p style={{
                          fontSize: '13px', color: 'var(--text-tertiary)',
                          margin: '8px 0 0 0',
                        }}>
                          <span className="typing-dots">{loadingStage}</span>
                        </p>
                      )}
                    </div>
                  ) : msg.type === 'visualization' ? (
                    <div style={{ marginBottom: '24px' }}>
                      {msg.planText && (
                        <div style={{
                          backgroundColor: 'var(--grey-50, #f8f8fa)',
                          borderRadius: '12px', padding: '16px 20px',
                          marginBottom: '12px',
                          borderLeft: '3px solid #28CD56',
                        }}>
                          <div style={{
                            fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)',
                          }}>
                            {msg.planText}
                          </div>
                        </div>
                      )}

                      <DynamicChart data={msg.chartData} config={msg.chartConfig} />
                      <MetricsDisplay metrics={msg.metrics} />

                      {msg.sandboxError && (
                        <div style={{
                          backgroundColor: '#FEF2F2', borderRadius: '8px',
                          padding: '12px 16px', marginTop: '8px',
                          fontSize: '13px', color: '#DC2626',
                          borderLeft: '3px solid #DC2626',
                        }}>
                          Sandbox error: {msg.sandboxError.message}
                        </div>
                      )}

                      {msg.insight && (
                        <div style={{ marginTop: '12px' }} className="markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.insight}
                          </ReactMarkdown>
                        </div>
                      )}

                      {msg.timing && (
                        <div style={{
                          marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap',
                        }}>
                          {msg.timing.thinking_ms != null && (
                            <span style={{
                              fontSize: '11px', padding: '2px 8px',
                              backgroundColor: '#F3E8FF', borderRadius: '8px', color: '#7C3AED',
                            }}>
                              Think {(msg.timing.thinking_ms / 1000).toFixed(1)}s
                            </span>
                          )}
                          {msg.timing.execution_ms != null && (
                            <span style={{
                              fontSize: '11px', padding: '2px 8px',
                              backgroundColor: '#DCFCE7', borderRadius: '8px', color: '#16A34A',
                            }}>
                              Sandbox {msg.timing.execution_ms}ms
                            </span>
                          )}
                          {msg.timing.total_ms && (
                            <span style={{
                              fontSize: '11px', color: 'var(--text-tertiary)',
                            }}>
                              {(msg.timing.total_ms / 1000).toFixed(1)}s total
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : msg.type === 'sandbox_result' ? (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
                        marginBottom: '4px',
                      }}>
                        {msg.fnName && <code style={{ color: 'var(--accent-primary)' }}>{msg.fnName}()</code>}
                      </div>
                      {msg.result?.success && (
                        <div style={{
                          backgroundColor: 'var(--grey-50)', borderRadius: '8px',
                          padding: '12px 16px', fontSize: '13px',
                          fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto',
                        }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(msg.result.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      <SandboxResult result={msg.result} />
                    </div>
                  ) : (
                    <div style={{ marginBottom: '24px' }}>
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && loadingStage && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{
                    fontSize: '15px', color: 'var(--text-tertiary)',
                    lineHeight: 1.7, margin: 0,
                  }}>
                    <span className="typing-dots">{loadingStage}</span>
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            }}>
              {/* Icon — cycling wheel */}
              <div style={{
                width: 56, height: 56, borderRadius: '16px',
                backgroundColor: 'var(--grey-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="10" stroke="var(--text-primary)" strokeWidth="2"/>
                  <circle cx="14" cy="14" r="3" stroke="var(--text-primary)" strokeWidth="2"/>
                  <path d="M14 4V11M14 17V24M4 14H11M17 14H24M7 7L12 12M16 16L21 21M21 7L16 12M12 16L7 21" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 style={{
                fontSize: '36px', fontWeight: 400,
                color: 'var(--text-primary)',
                margin: '32px 0 0 0', lineHeight: 1.2, letterSpacing: '-0.02em',
              }}>
                Universal Cycling<br />
                <span style={{ fontWeight: 700 }}>Agent.</span>
              </h1>
              <p style={{
                fontSize: '16px', color: 'var(--text-secondary)',
                maxWidth: '480px', lineHeight: 1.6, margin: '20px 0 0 0',
              }}>
                Load any FIT, TCX, or GPX file. Ask anything.
                {' '}Climbs, intervals, power zones, W' balance, pacing —
                {' '}{Object.keys(FUNCTION_REGISTRY).length} domain functions in a live sandbox.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', backgroundColor: 'var(--accent-primary)', color: '#fff',
                  border: 'none', borderRadius: '12px',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V10M8 2L5 5M8 2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 10V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Upload Activity File
              </button>
              <p style={{
                fontSize: '13px', color: 'var(--text-tertiary)', margin: '8px 0 0 0',
              }}>
                FIT / TCX / GPX — or drag and drop anywhere
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div style={{
        padding: '24px', backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--grey-100)',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {/* Activity info bar */}
          {activityLoaded && (
            <ActivityInfoBar onRemove={removeActivity} />
          )}

          {/* Function explorer (only when activity loaded) */}
          {activityLoaded && (
            <FunctionExplorer onRunFunction={runFunction} />
          )}

          {/* Input Box */}
          <div style={{
            backgroundColor: 'var(--grey-100)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px', color: 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', flexShrink: 0,
                }}
                title="Upload file"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M15 9.75V14.25C15 14.6642 14.8354 15.0614 14.5429 15.3536C14.2504 15.6458 13.8533 15.8104 13.4391 15.8104H4.56087C4.14674 15.8104 3.74963 15.6458 3.45709 15.3536C3.16456 15.0614 3 14.6642 3 14.25V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6L9 3L6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 3V11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder={activityLoaded ? "Ask anything about your ride..." : "Upload a file to get started..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                style={{
                  flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '15px', fontFamily: 'inherit',
                }}
              />

              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  backgroundColor: inputValue.trim() && !isLoading ? 'var(--accent-primary)' : 'var(--grey-300)',
                  border: 'none', borderRadius: '10px',
                  width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                  transition: 'background-color 0.15s ease', flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Action Pills */}
          {activityLoaded && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px',
            }}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  style={{
                    backgroundColor: 'var(--grey-100)', border: 'none',
                    borderRadius: '20px', padding: '10px 18px',
                    fontSize: '14px', color: 'var(--text-primary)',
                    cursor: isLoading ? 'default' : 'pointer',
                    fontFamily: 'inherit', transition: 'background-color 0.2s',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--grey-200)' }}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-100)'}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".fit,.tcx,.gpx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default UniversalAgent
