import React, { useState, useEffect } from 'react'

// Complete list of all database tables
const TABLES = [
  // Training
  { name: 'tcx_files', label: 'Workouts (TCX Files)', category: 'Training' },
  { name: 'training_load', label: 'Training Load (PMC)', category: 'Training' },
  { name: 'planned_workouts', label: 'Planned Workouts', category: 'Training' },

  // Power Profile
  { name: 'signature_metrics', label: 'Signature Metrics', category: 'Power Profile' },
  { name: 'power_duration_curve', label: 'Power Duration Curve', category: 'Power Profile' },
  { name: 'seven_axis_profile', label: '7-Axis Profile', category: 'Power Profile' },
  { name: 'metabolic_profile', label: 'Metabolic Profile', category: 'Power Profile' },
  { name: 'durability_metrics', label: 'Durability Metrics', category: 'Power Profile' },

  // Identity
  { name: 'athlete_profile', label: 'Athlete Profile', category: 'Identity' },
  { name: 'athlete_connections', label: 'Connected Apps', category: 'Identity' },

  // Daily Data
  { name: 'daily_log', label: 'Daily Log', category: 'Daily Data' },
  { name: 'daily_sleep', label: 'Sleep', category: 'Daily Data' },
  { name: 'daily_nutrition', label: 'Nutrition', category: 'Daily Data' },
  { name: 'daily_meals', label: 'Meals', category: 'Daily Data' },
  { name: 'daily_wellness', label: 'Wellness', category: 'Daily Data' },
  { name: 'daily_biometrics', label: 'Biometrics', category: 'Daily Data' },
  { name: 'daily_weather', label: 'Weather', category: 'Daily Data' },
  { name: 'daily_medical', label: 'Medical', category: 'Daily Data' },

  // Calendar
  { name: 'events', label: 'Events / Races', category: 'Calendar' },
  { name: 'life_events', label: 'Life Events', category: 'Calendar' },
  { name: 'travel', label: 'Travel', category: 'Calendar' },

  // Summaries
  { name: 'weekly_summary', label: 'Weekly Summary', category: 'Summaries' },
  { name: 'monthly_summary', label: 'Monthly Summary', category: 'Summaries' },

  // Equipment & Finance
  { name: 'equipment', label: 'Equipment', category: 'Equipment & Finance' },
  { name: 'equipment_usage', label: 'Equipment Usage', category: 'Equipment & Finance' },
  { name: 'expenses', label: 'Expenses', category: 'Equipment & Finance' },

  // Intelligence
  { name: 'athlete_insights', label: 'AI Insights', category: 'Intelligence' },
  { name: 'training_focus', label: 'Training Focus', category: 'Intelligence' },
]

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: '', label: 'All Data' },
]

// Important columns to show for each table (in display order)
const COLUMN_CONFIG = {
  tcx_files: ['activity_date', 'activity_type', 'workout_type', 'duration_seconds', 'distance_meters', 'avg_power', 'normalized_power', 'tss', 'avg_hr', 'feeling'],
  training_load: ['date', 'tss_total', 'ctl', 'atl', 'tsb', 'ramp_rate', 'activities_count', 'duration_total_seconds'],
  planned_workouts: ['scheduled_date', 'workout_type', 'title', 'duration_planned_minutes', 'tss_planned', 'intensity_target', 'completed'],
  signature_metrics: ['recorded_at', 'ftp_watts', 'ftp_w_per_kg', 'critical_power_watts', 'w_prime_kj', 'max_hr', 'lt1_hr', 'lt2_hr'],
  power_duration_curve: ['duration_seconds', 'power_watts', 'w_per_kg', 'date_achieved', 'physiological_parameter'],
  seven_axis_profile: ['recorded_at', 'neuromuscular', 'w_prime', 'glycolytic', 'vo2max', 'threshold', 'endurance', 'durability'],
  metabolic_profile: ['recorded_at', 'fat_max_watts', 'fat_max_hr', 'cho_dependency', 'efficiency_factor'],
  durability_metrics: ['recorded_at', 'durability_index', 'time_to_exhaustion_mins', 'power_fade_pct'],
  athlete_profile: ['name', 'email', 'date_of_birth', 'weight_kg', 'height_cm', 'ftp_current', 'primary_sport', 'rider_type'],
  daily_log: ['date', 'summary', 'activities_count', 'total_tss', 'total_duration_minutes', 'feeling_overall'],
  daily_sleep: ['date', 'total_sleep_minutes', 'sleep_score', 'deep_sleep_minutes', 'rem_sleep_minutes', 'light_sleep_minutes', 'awake_minutes', 'hrv_avg', 'sleep_start', 'sleep_end'],
  daily_nutrition: ['date', 'calories_total', 'calories_target', 'protein_g', 'carbs_g', 'fat_g', 'water_liters', 'nutrition_score', 'fueling_compliance'],
  daily_meals: ['date', 'meal_type', 'meal_time', 'meal_name', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
  daily_wellness: ['date', 'readiness_score', 'energy_level', 'stress_level', 'mood', 'motivation', 'soreness_level', 'fatigue_level', 'notes'],
  daily_biometrics: ['date', 'weight_kg', 'body_fat_pct', 'resting_hr', 'hrv_rmssd', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'spo2'],
  daily_weather: ['date', 'temperature_c', 'humidity_pct', 'wind_speed_kmh', 'conditions', 'air_quality_index'],
  daily_medical: ['date', 'illness_symptoms', 'injury_status', 'medication', 'notes'],
  events: ['date', 'name', 'event_type', 'priority', 'distance_km', 'elevation_m', 'goal_time', 'goal_power', 'status'],
  life_events: ['date', 'event_type', 'description', 'impact_training', 'duration_days'],
  travel: ['departure_date', 'return_date', 'destination', 'purpose', 'timezone_change', 'altitude_change_m'],
  weekly_summary: ['week_start', 'total_tss', 'total_hours', 'activities_count', 'ctl_end', 'atl_end', 'tsb_end', 'longest_ride_minutes', 'biggest_tss_day'],
  monthly_summary: ['month', 'total_tss', 'total_hours', 'activities_count', 'avg_weekly_tss', 'ftp_start', 'ftp_end', 'weight_start_kg', 'weight_end_kg'],
  equipment: ['name', 'equipment_type', 'brand', 'model', 'purchase_date', 'purchase_price', 'current_distance_km', 'status'],
  equipment_usage: ['date', 'equipment_id', 'distance_km', 'duration_minutes'],
  expenses: ['date', 'category', 'description', 'amount', 'currency', 'vendor'],
  athlete_insights: ['created_at', 'insight_type', 'title', 'content', 'priority', 'status'],
  training_focus: ['start_date', 'end_date', 'phase', 'primary_goal', 'weekly_hours_target', 'weekly_tss_target'],
}

// Column display names (prettier versions)
const COLUMN_LABELS = {
  tss: 'TSS',
  ctl: 'CTL',
  atl: 'ATL',
  tsb: 'TSB',
  ftp_watts: 'FTP (W)',
  ftp_w_per_kg: 'FTP (W/kg)',
  ftp_current: 'FTP (W)',
  critical_power_watts: 'CP (W)',
  w_prime_kj: "W' (kJ)",
  w_prime: "W'",
  avg_power: 'Avg Power',
  normalized_power: 'NP',
  avg_hr: 'Avg HR',
  max_hr: 'Max HR',
  lt1_hr: 'LT1 HR',
  lt2_hr: 'LT2 HR',
  hrv_avg: 'HRV Avg',
  hrv_rmssd: 'HRV (RMSSD)',
  vo2max: 'VO2max',
  spo2: 'SpO2',
  pct: '%',
}

const DataViewer = () => {
  const [selectedTable, setSelectedTable] = useState('training_load')
  const [dateRange, setDateRange] = useState('last_7_days')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    setExpandedRow(null)

    try {
      const response = await fetch('/.netlify/functions/query-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: selectedTable,
          date_range: dateRange || undefined,
          limit: 200
        })
      })

      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        setError(result.error || 'Failed to fetch data')
        setData(null)
      }
    } catch (err) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedTable, dateRange])

  const formatColumnName = (col) => {
    if (COLUMN_LABELS[col]) return COLUMN_LABELS[col]
    return col
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace('Pct', '%')
      .replace('Kg', 'kg')
      .replace('Km', 'km')
  }

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
    if (typeof value === 'boolean') return value ? '✓ Yes' : '✗ No'

    // JSON objects - show compact preview
    if (typeof value === 'object') {
      const str = JSON.stringify(value)
      if (str.length > 50) {
        return <span title={str} style={{ cursor: 'help' }}>{str.substring(0, 47)}...</span>
      }
      return str
    }

    // Dates
    if (key.includes('date') || key === 'recorded_at' || key === 'created_at' || key === 'week_start' || key === 'month') {
      const date = new Date(value)
      if (key === 'month') {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    // Times
    if (key.includes('_time') || key.includes('_start') || key.includes('_end')) {
      if (typeof value === 'string' && value.includes('T')) {
        return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    }

    // Duration in seconds -> hours/minutes
    if ((key.includes('seconds') || key.includes('duration')) && typeof value === 'number' && value > 60) {
      const hrs = Math.floor(value / 3600)
      const mins = Math.floor((value % 3600) / 60)
      if (hrs > 0) return `${hrs}h ${mins}m`
      return `${mins}m`
    }

    // Duration in minutes -> hours/minutes
    if (key.includes('minutes') && typeof value === 'number' && value > 60) {
      const hrs = Math.floor(value / 60)
      const mins = Math.round(value % 60)
      if (hrs > 0) return `${hrs}h ${mins}m`
      return `${Math.round(value)}m`
    }

    // Distance in meters -> km
    if (key.includes('meters') && typeof value === 'number') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`
    }

    // Distance in km
    if (key.includes('_km') && typeof value === 'number') {
      return `${value.toFixed(1)} km`
    }

    // Weight
    if (key.includes('weight') && key.includes('kg') && typeof value === 'number') {
      return `${value.toFixed(1)} kg`
    }

    // Percentages
    if ((key.includes('pct') || key.includes('compliance') || key.includes('_level')) && typeof value === 'number') {
      return `${Math.round(value)}%`
    }

    // Power values
    if ((key.includes('power') || key.includes('watts') || key === 'ftp_current') && typeof value === 'number') {
      return `${Math.round(value)}W`
    }

    // W/kg values
    if (key.includes('w_per_kg') && typeof value === 'number') {
      return `${value.toFixed(2)} W/kg`
    }

    // Heart rate
    if ((key.includes('_hr') || key === 'resting_hr' || key === 'avg_hr' || key === 'max_hr') && typeof value === 'number') {
      return `${Math.round(value)} bpm`
    }

    // Temperature
    if (key.includes('temperature') && typeof value === 'number') {
      return `${value.toFixed(1)}°C`
    }

    // Currency/money
    if ((key === 'amount' || key.includes('price')) && typeof value === 'number') {
      return `$${value.toFixed(2)}`
    }

    // Scores (1-100)
    if (key.includes('score') && typeof value === 'number') {
      const color = value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--warning)' : 'var(--danger)'
      return <span style={{ color, fontWeight: 500 }}>{Math.round(value)}</span>
    }

    // TSB (can be negative)
    if (key === 'tsb' && typeof value === 'number') {
      const color = value > 0 ? 'var(--success)' : value < -10 ? 'var(--danger)' : 'var(--text-primary)'
      return <span style={{ color, fontWeight: 500 }}>{value > 0 ? '+' : ''}{Math.round(value)}</span>
    }

    // General numbers
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)
    }

    return String(value)
  }

  const getImportantColumns = (tableName) => {
    return COLUMN_CONFIG[tableName] || null
  }

  // Filter rows by search term
  const filterRows = (rows) => {
    if (!searchTerm) return rows
    const term = searchTerm.toLowerCase()
    return rows.filter(row =>
      Object.values(row).some(val =>
        val && String(val).toLowerCase().includes(term)
      )
    )
  }

  const renderTable = () => {
    if (!data || !data.data || data.data.length === 0) {
      return (
        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📭</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            No data found for this selection
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '8px' }}>
            Try selecting a different date range or check if data has been synced
          </div>
        </div>
      )
    }

    const allRows = data.data
    const rows = filterRows(allRows)
    const importantCols = getImportantColumns(selectedTable)
    const allColumns = Object.keys(allRows[0]).filter(k => k !== 'id' && k !== 'athlete_id')
    const displayColumns = importantCols || allColumns.slice(0, 8)

    if (rows.length === 0 && searchTerm) {
      return (
        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🔍</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            No matches for "{searchTerm}"
          </div>
        </div>
      )
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--grey-100)' }}>
              {displayColumns.map(col => (
                <th key={col} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  borderBottom: '2px solid var(--grey-200)',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'var(--grey-100)',
                  zIndex: 1
                }}>
                  {formatColumnName(col)}
                </th>
              ))}
              <th style={{
                padding: '12px 16px',
                borderBottom: '2px solid var(--grey-200)',
                width: '60px',
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--grey-100)',
                zIndex: 1
              }}>
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <React.Fragment key={row.id || idx}>
                <tr
                  style={{
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--grey-50)',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s'
                  }}
                  onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-100)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'var(--grey-50)'}
                >
                  {displayColumns.map(col => (
                    <td key={col} style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--grey-200)',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatValue(row[col], col)}
                    </td>
                  ))}
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--grey-200)', textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedRow(expandedRow === idx ? null : idx)
                      }}
                      style={{
                        background: expandedRow === idx ? 'var(--accent-primary)' : 'none',
                        color: expandedRow === idx ? 'white' : 'var(--text-secondary)',
                        border: expandedRow === idx ? 'none' : '1px solid var(--grey-300)',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.15s'
                      }}
                    >
                      {expandedRow === idx ? '▲ Hide' : '▼ View'}
                    </button>
                  </td>
                </tr>
                {expandedRow === idx && (
                  <tr>
                    <td colSpan={displayColumns.length + 1} style={{
                      padding: '20px',
                      backgroundColor: 'var(--grey-50)',
                      borderBottom: '2px solid var(--grey-200)'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        All Fields
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '10px'
                      }}>
                        {allColumns.map(col => (
                          <div key={col} style={{
                            padding: '10px 14px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid var(--grey-200)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                          }}>
                            <div style={{
                              fontSize: '11px',
                              color: 'var(--text-tertiary)',
                              marginBottom: '4px',
                              fontWeight: 500
                            }}>
                              {formatColumnName(col)}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              wordBreak: 'break-word',
                              color: row[col] === null ? 'var(--text-tertiary)' : 'var(--text-primary)'
                            }}>
                              {formatValue(row[col], col)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Group tables by category
  const tablesByCategory = TABLES.reduce((acc, table) => {
    if (!acc[table.category]) acc[table.category] = []
    acc[table.category].push(table)
    return acc
  }, {})

  const currentTableInfo = TABLES.find(t => t.name === selectedTable)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--grey-200)',
        backgroundColor: 'white'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
          Data Viewer
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Browse and debug all {TABLES.length} database tables
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Table List Sidebar */}
        <div style={{
          width: '260px',
          borderRight: '1px solid var(--grey-200)',
          overflow: 'auto',
          backgroundColor: 'var(--grey-50)',
          padding: '16px 12px'
        }}>
          {Object.entries(tablesByCategory).map(([category, tables]) => (
            <div key={category} style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '0 8px',
                marginBottom: '8px'
              }}>
                {category}
              </div>
              {tables.map(table => (
                <button
                  key={table.name}
                  onClick={() => {
                    setSelectedTable(table.name)
                    setSearchTerm('')
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: selectedTable === table.name ? 'var(--accent-primary)' : 'transparent',
                    color: selectedTable === table.name ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: selectedTable === table.name ? 500 : 400,
                    marginBottom: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {table.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filters Bar */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--grey-200)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'white',
            flexWrap: 'wrap'
          }}>
            {/* Current Table Name */}
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              minWidth: '150px'
            }}>
              {currentTableInfo?.label || selectedTable}
            </div>

            <div style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--grey-200)'
            }} />

            {/* Date Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--grey-300)',
                  fontSize: '13px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                {DATE_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search in results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--grey-300)',
                  fontSize: '13px',
                  width: '180px'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    fontSize: '16px',
                    padding: '0 4px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={fetchData}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Refresh
            </button>

            {/* Record Count */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {data && (
                <span style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--grey-100)',
                  padding: '4px 10px',
                  borderRadius: '12px'
                }}>
                  {searchTerm ? `${filterRows(data.data).length} of ` : ''}
                  {data.metadata?.records || 0} records
                </span>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white' }}>
            {loading ? (
              <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid var(--grey-200)',
                  borderTopColor: 'var(--accent-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <div style={{ color: 'var(--text-secondary)' }}>Loading {currentTableInfo?.label}...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : error ? (
              <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>⚠️</div>
                <div style={{ color: 'var(--danger)', fontSize: '15px', marginBottom: '8px' }}>
                  {error}
                </div>
                <button
                  onClick={fetchData}
                  style={{
                    marginTop: '12px',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: '1px solid var(--grey-300)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              renderTable()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataViewer
