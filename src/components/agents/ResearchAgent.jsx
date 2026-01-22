import React from 'react'

const ResearchAgent = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '8px'
      }}>
        Research Agent
      </h2>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '24px'
      }}>
        Deep dive into topics with comprehensive AI research.
      </p>

      {/* Search Box */}
      <div style={{
        backgroundColor: 'var(--grey-100)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6" stroke="var(--grey-400)" strokeWidth="1.5"/>
          <path d="M14 14L18 18" stroke="var(--grey-400)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Enter a research topic..."
          style={{
            flex: 1,
            border: 'none',
            backgroundColor: 'transparent',
            fontSize: '15px',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
      </div>

      {/* Recent Topics */}
      <h3 style={{
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Suggested Topics
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {[
          { topic: 'Latest AI developments in 2024', icon: '🤖' },
          { topic: 'Climate change solutions', icon: '🌍' },
          { topic: 'Quantum computing basics', icon: '⚛️' },
          { topic: 'Sustainable energy trends', icon: '⚡' }
        ].map((item, idx) => (
          <div key={idx} style={{
            backgroundColor: 'var(--grey-50)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-100)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-50)'}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.topic}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 'auto' }}>
              <path d="M6 4L10 8L6 12" stroke="var(--grey-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResearchAgent
