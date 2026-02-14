import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  LineChart, BarChart, AreaChart, ScatterChart, ComposedChart,
  Line, Bar, Area, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush,
  ReferenceLine, ResponsiveContainer
} from 'recharts'

// ─────────────────────────────────────────────
// FILE PARSERS (client-side) — same as CodeAgent
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
// DATA SUMMARIZER
// ─────────────────────────────────────────────

function summarizeData(points) {
  if (!points || points.length === 0) return null

  const fields = {}
  const allKeys = new Set()
  points.forEach(p => Object.keys(p).forEach(k => allKeys.add(k)))

  for (const key of allKeys) {
    if (key === 'timestamp' || key === 'timestamp_raw') continue
    const values = points.map(p => p[key]).filter(v => v != null && typeof v === 'number')
    if (values.length === 0) continue

    fields[key] = {
      count: values.length,
      min: Math.round(Math.min(...values) * 100) / 100,
      max: Math.round(Math.max(...values) * 100) / 100,
      avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
    }
  }

  const duration = points[points.length - 1]?.elapsed_seconds || 0
  const distance = points[points.length - 1]?.distance_meters || 0

  return {
    point_count: points.length,
    duration_seconds: Math.round(duration),
    distance_km: Math.round(distance / 10) / 100,
    fields,
    sample_rate: points.length > 1
      ? Math.round(duration / points.length * 10) / 10
      : null
  }
}

// ─────────────────────────────────────────────
// SANDBOX EXECUTOR
// ─────────────────────────────────────────────

function executeSandbox(codeStr, data) {
  try {
    const fn = new Function('data', codeStr)
    const result = fn(data)
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─────────────────────────────────────────────
// DYNAMIC CHART RENDERER
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
      borderRadius: '12px',
      padding: '16px',
      marginTop: '12px',
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
// PIPELINE INFO (single-call timing)
// ─────────────────────────────────────────────

const PipelineInfo = ({ timing }) => {
  const [expanded, setExpanded] = useState(false)
  if (!timing) return null

  return (
    <div style={{
      marginTop: '12px',
      borderTop: '1px solid var(--grey-100)',
      paddingTop: '12px',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '12px',
          width: '100%', fontFamily: 'inherit',
        }}
      >
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
        }}>
          {timing.sonnet_ms && (
            <span style={{
              fontSize: '11px', padding: '2px 8px',
              backgroundColor: 'var(--grey-100)', borderRadius: '8px',
              color: 'var(--text-tertiary)', whiteSpace: 'nowrap',
            }}>
              Sonnet {timing.sonnet_ms}ms
            </span>
          )}
          {timing.execution_ms != null && (
            <span style={{
              fontSize: '11px', padding: '2px 8px',
              backgroundColor: 'var(--grey-100)', borderRadius: '8px',
              color: 'var(--text-tertiary)', whiteSpace: 'nowrap',
            }}>
              Execute {timing.execution_ms}ms
            </span>
          )}
          {timing.total_ms && (
            <span style={{
              fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '4px',
            }}>
              {(timing.total_ms / 1000).toFixed(1)}s total
            </span>
          )}
        </div>

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
        <div style={{
          marginTop: '12px', padding: '12px 16px',
          backgroundColor: 'var(--grey-50, #f8f8fa)',
          borderRadius: '12px', fontSize: '13px',
          color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Pipeline Details — Single Sonnet Call
          </div>
          <div style={{ fontSize: '12px' }}>
            {timing.sonnet_ms && <div>Sonnet 4.5 (plan + code + insight): {(timing.sonnet_ms / 1000).toFixed(1)}s</div>}
            {timing.execution_ms != null && <div>Client Execution: {timing.execution_ms}ms</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// FILE INFO BAR
// ─────────────────────────────────────────────

const FileInfoBar = ({ fileName, summary, onRemove }) => {
  if (!fileName) return null

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
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{fileName}</span>
        {summary && (
          <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>
            {summary.point_count.toLocaleString()} points
            {summary.duration_seconds > 0 && ` / ${Math.round(summary.duration_seconds / 60)}min`}
            {summary.distance_km > 0 && ` / ${summary.distance_km}km`}
          </span>
        )}
      </div>
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

const CodeAgentTwo = () => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [fileData, setFileData] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  const quickActions = [
    { label: "Power Over Time", prompt: "Show my power output over the ride with a 30s rolling average" },
    { label: "Heart Rate Zones", prompt: "Analyze my heart rate zone distribution for this ride" },
    { label: "Power vs HR", prompt: "Show the correlation between power and heart rate — scatter plot" },
    { label: "Elevation Profile", prompt: "Show the elevation profile with speed overlay" },
    { label: "Cadence Analysis", prompt: "Analyze my cadence patterns and distribution" },
    { label: "Ride Summary", prompt: "Give me a complete summary of this ride with key metrics" },
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

      const summary = summarizeData(points)
      setFileData({ name: file.name, points, summary })

      const fieldList = Object.keys(summary.fields).join(', ')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**File loaded: ${file.name}**\n\n` +
          `${summary.point_count.toLocaleString()} data points parsed` +
          (summary.duration_seconds > 0 ? ` over ${Math.round(summary.duration_seconds / 60)} minutes` : '') +
          (summary.distance_km > 0 ? ` / ${summary.distance_km} km` : '') +
          `.\n\n**Available fields:** ${fieldList}\n\nAsk me anything about this ride — power analysis, heart rate zones, elevation profile, cadence patterns, and more.`
      }])
    } catch (err) {
      console.error('File parse error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error parsing "${file.name}": ${err.message}. Please check the file and try again.`
      }])
    }
  }, [])

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

  const removeFile = useCallback(() => {
    setFileData(null)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'File removed. Upload a new file or ask a general question.'
    }])
  }, [])

  // ─── MESSAGE SENDING ──────────────────────────────

  const buildSamples = useCallback(() => {
    if (!fileData) return null
    const pts = fileData.points
    const sampleCount = 20
    const step = Math.max(1, Math.floor(pts.length / sampleCount))
    const samples = []
    for (let i = 0; i < pts.length && samples.length < sampleCount; i += step) {
      samples.push(pts[i])
    }
    return samples
  }, [fileData])

  const callAgent = async (body) => {
    const response = await fetch('/.netlify/functions/code-agent-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const statusMsg = response.status === 504
        ? 'The analysis timed out — try a simpler question or a smaller file.'
        : `Server error (${response.status}). Please try again.`
      return { type: 'error', response: statusMsg }
    }
    const data = await response.json()
    if (!response.ok) {
      return { type: 'error', response: data.error || 'Sorry, I encountered an error.' }
    }
    return data
  }

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: messageText }])
    setIsLoading(true)
    setLoadingStage('Analyzing with Sonnet...')

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : 'Visualization result'
      }))

      // ─── CHAT MODE (no file) ────────────────────
      if (!fileData) {
        const data = await callAgent({ message: messageText, history, mode: 'chat' })
        setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.error || 'No response.' }])
        return
      }

      // ─── SINGLE-CALL ANALYSIS ────────────────────
      const samples = buildSamples()
      const data = await callAgent({
        message: messageText,
        history,
        dataSummary: fileData.summary,
        samplePoints: samples
      })

      if (data.type === 'error') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        return
      }

      // Execute code client-side
      setLoadingStage('Executing analysis...')
      const execStart = Date.now()

      const extractionResult = executeSandbox(data.extraction_code, fileData.points)
      if (!extractionResult.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Code execution failed: ${extractionResult.error}. Let me try a different approach.`
        }])
        return
      }

      const metricsResult = executeSandbox(data.metrics_code, fileData.points)
      const metrics = metricsResult.success ? metricsResult.data : []
      const executionMs = Date.now() - execStart

      // Build the visualization message — everything from one call
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'visualization',
        plan: data.plan,
        chartData: extractionResult.data,
        chartConfig: data.chart_config,
        metrics,
        insight: data.insight,
        timing: {
          sonnet_ms: data.timing?.sonnet_ms,
          execution_ms: executionMs,
          total_ms: (data.timing?.sonnet_ms || 0) + executionMs
        }
      }])

    } catch (error) {
      console.error('Code agent v2 error:', error)
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
          maxWidth: '720px', width: '100%', margin: '0 auto',
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
                  ) : msg.type === 'visualization' ? (
                    <div style={{ marginBottom: '24px' }}>
                      {/* Coach's plan */}
                      {msg.plan && (
                        <div style={{
                          backgroundColor: 'var(--grey-50, #f8f8fa)',
                          borderRadius: '12px', padding: '16px 20px',
                          marginBottom: '12px',
                          borderLeft: '3px solid #28CD56',
                        }}>
                          <div style={{
                            fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)',
                          }}>
                            {msg.plan}
                          </div>
                        </div>
                      )}

                      {/* Chart */}
                      <DynamicChart data={msg.chartData} config={msg.chartConfig} />

                      {/* Metrics */}
                      <MetricsDisplay metrics={msg.metrics} />

                      {/* Insight */}
                      {msg.insight && (
                        <div style={{ marginTop: '12px' }} className="markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.insight}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Pipeline info */}
                      <PipelineInfo timing={msg.timing} />
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
              {isLoading && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{
                    fontSize: '15px', color: 'var(--text-tertiary)',
                    lineHeight: 1.7, margin: 0,
                  }}>
                    <span className="typing-dots">{loadingStage || 'Analyzing'}</span>
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
              {/* V2 Icon — lightning bolt */}
              <div style={{
                width: 56, height: 56, borderRadius: '16px',
                backgroundColor: 'var(--grey-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M15 3L5 16H14L13 25L23 12H14L15 3Z" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 style={{
                fontSize: '36px', fontWeight: 400,
                color: 'var(--text-primary)',
                margin: '32px 0 0 0', lineHeight: 1.2, letterSpacing: '-0.02em',
              }}>
                Code Assistant<br />
                <span style={{ fontWeight: 700 }}>Two.</span>
              </h1>
              <p style={{
                fontSize: '16px', color: 'var(--text-secondary)',
                maxWidth: '420px', lineHeight: 1.6, margin: '20px 0 0 0',
              }}>
                Single Sonnet call — plan, code, chart config, and insight in one shot. Upload a FIT, TCX, or GPX file to get started.
              </p>

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', backgroundColor: '#28CD56', color: '#fff',
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
                or drag and drop a file anywhere
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
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          {/* File info bar */}
          <FileInfoBar
            fileName={fileData?.name}
            summary={fileData?.summary}
            onRemove={removeFile}
          />

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
                placeholder={fileData ? "Ask about your ride..." : "Upload a file or ask a question..."}
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
                  backgroundColor: inputValue.trim() && !isLoading ? '#28CD56' : 'var(--grey-300)',
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
          {fileData && (
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

export default CodeAgentTwo
