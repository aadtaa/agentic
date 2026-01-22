import React, { useState, useEffect } from 'react'

const TABLES = [
  { name: 'tcx_files', label: 'Workouts (TCX Files)', category: 'Training' },
  { name: 'training_load', label: 'Training Load (CTL/ATL/TSB)', category: 'Training' },
  { name: 'planned_workouts', label: 'Planned Workouts', category: 'Training' },
  { name: 'signature_metrics', label: 'Signature Metrics (FTP, CP)', category: 'Power Profile' },
  { name: 'power_duration_curve', label: 'Power Duration Curve', category: 'Power Profile' },
  { name: 'seven_axis_profile', label: '7-Axis Profile', category: 'Power Profile' },
  { name: 'athlete_profile', label: 'Athlete Profile', category: 'Identity' },
  { name: 'daily_log', label: 'Daily Log', category: 'Daily Data' },
  { name: 'daily_sleep', label: 'Sleep Data', category: 'Daily Data' },
  { name: 'daily_nutrition', label: 'Nutrition', category: 'Daily Data' },
  { name: 'daily_wellness', label: 'Wellness', category: 'Daily Data' },
  { name: 'daily_biometrics', label: 'Biometrics', category: 'Daily Data' },
  { name: 'events', label: 'Events / Races', category: 'Calendar' },
  { name: 'weekly_summary', label: 'Weekly Summary', category: 'Summaries' },
  { name: 'monthly_summary', label: 'Monthly Summary', category: 'Summaries' },
  { name: 'equipment', label: 'Equipment', category: 'Equipment' },
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

const DataViewer = () => {
  const [selectedTable, setSelectedTable] = useState('tcx_files')
  const [dateRange, setDateRange] = useState('last_7_days')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)

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
          limit: 100
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

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    if (key.includes('date') || key === 'recorded_at' || key === 'created_at') {
      return new Date(value).toLocaleDateString()
    }
    if (key.includes('seconds') && typeof value === 'number') {
      const hrs = Math.floor(value / 3600)
      const mins = Math.floor((value % 3600) / 60)
      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
    }
    if (key.includes('meters') && typeof value === 'number') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value : value.toFixed(2)
    }
    return String(value)
  }

  const getImportantColumns = (tableName) => {
    const columnSets = {
      tcx_files: ['activity_date', 'activity_type', 'workout_type', 'duration_seconds', 'distance_meters', 'avg_power', 'normalized_power', 'tss', 'avg_hr', 'feeling'],
      training_load: ['date', 'tss_total', 'ctl', 'atl', 'tsb', 'ramp_rate', 'activities_count'],
      planned_workouts: ['scheduled_date', 'workout_type', 'title', 'duration_planned_minutes', 'tss_planned', 'completed'],
      signature_metrics: ['recorded_at', 'ftp_watts', 'ftp_w_per_kg', 'critical_power_watts', 'w_prime_kj', 'max_hr'],
      power_duration_curve: ['duration_seconds', 'power_watts', 'w_per_kg', 'physiological_parameter'],
      daily_sleep: ['date', 'total_sleep_minutes', 'sleep_score', 'deep_sleep_minutes', 'rem_sleep_minutes', 'hrv_avg'],
      daily_nutrition: ['date', 'calories_total', 'protein_g', 'carbs_g', 'fat_g', 'water_liters'],
      events: ['date', 'name', 'event_type', 'priority', 'distance_km', 'goal_time'],
      weekly_summary: ['week_start', 'total_tss', 'total_hours', 'activities_count', 'ctl_end', 'atl_end', 'tsb_end'],
    }
    return columnSets[tableName] || null
  }

  const renderTable = () => {
    if (!data || !data.data || data.data.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No data found for this selection
        </div>
      )
    }

    const rows = data.data
    const importantCols = getImportantColumns(selectedTable)
    const allColumns = Object.keys(rows[0]).filter(k => k !== 'id' && k !== 'athlete_id')
    const displayColumns = importantCols || allColumns.slice(0, 8)

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
                  whiteSpace: 'nowrap'
                }}>
                  {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
              ))}
              <th style={{ padding: '12px 16px', borderBottom: '2px solid var(--grey-200)', width: '60px' }}>
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
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
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
                        background: 'none',
                        border: '1px solid var(--grey-300)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {expandedRow === idx ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {expandedRow === idx && (
                  <tr>
                    <td colSpan={displayColumns.length + 1} style={{
                      padding: '16px',
                      backgroundColor: 'var(--grey-100)',
                      borderBottom: '1px solid var(--grey-200)'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '12px'
                      }}>
                        {allColumns.map(col => (
                          <div key={col} style={{
                            padding: '8px 12px',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            border: '1px solid var(--grey-200)'
                          }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                              {col.replace(/_/g, ' ')}
                            </div>
                            <div style={{ fontSize: '13px', wordBreak: 'break-word' }}>
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
          Browse and inspect all database tables
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Table List Sidebar */}
        <div style={{
          width: '240px',
          borderRight: '1px solid var(--grey-200)',
          overflow: 'auto',
          backgroundColor: 'var(--grey-50)',
          padding: '16px 12px'
        }}>
          {Object.entries(tablesByCategory).map(([category, tables]) => (
            <div key={category} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '0 8px',
                marginBottom: '6px'
              }}>
                {category}
              </div>
              {tables.map(table => (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table.name)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: selectedTable === table.name ? 'var(--accent-primary)' : 'transparent',
                    color: selectedTable === table.name ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
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
          {/* Filters */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--grey-200)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--grey-300)',
                  fontSize: '13px',
                  backgroundColor: 'white'
                }}
              >
                {DATE_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
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
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>

            {data && (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                {data.metadata?.records || 0} records
                {data.metadata?.limited && ' (limited)'}
              </span>
            )}
          </div>

          {/* Data Table */}
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading...
              </div>
            ) : error ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
                {error}
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
