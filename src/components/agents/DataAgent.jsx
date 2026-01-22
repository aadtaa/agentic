import React from 'react'

const DataAgent = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '8px'
      }}>
        Data Analysis Agent
      </h2>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '24px'
      }}>
        Upload and analyze your data with AI-powered insights.
      </p>

      {/* Upload Area */}
      <div style={{
        border: '2px dashed var(--grey-300)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px',
        textAlign: 'center',
        backgroundColor: 'var(--grey-50)',
        marginBottom: '24px'
      }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '16px' }}>
          <path d="M24 32V16M24 16L18 22M24 16L30 22" stroke="var(--grey-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 32V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V32" stroke="var(--grey-400)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Drag and drop files here, or click to browse
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '8px' }}>
          Supports CSV, JSON, Excel files
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        {[
          { label: 'Datasets', value: '0', icon: '📊' },
          { label: 'Insights', value: '0', icon: '💡' },
          { label: 'Reports', value: '0', icon: '📄' }
        ].map((stat, idx) => (
          <div key={idx} style={{
            backgroundColor: 'var(--grey-100)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DataAgent
