import React from 'react'

const WritingAgent = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '8px'
      }}>
        Writing Agent
      </h2>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '24px'
      }}>
        Create, edit, and polish content with AI writing assistance.
      </p>

      {/* Document Type Selection */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {[
          { type: 'Blog Post', icon: '📝', desc: 'Engaging articles' },
          { type: 'Email', icon: '✉️', desc: 'Professional emails' },
          { type: 'Report', icon: '📊', desc: 'Business reports' },
          { type: 'Creative', icon: '✨', desc: 'Stories & poems' }
        ].map((item, idx) => (
          <div key={idx} style={{
            backgroundColor: idx === 0 ? 'var(--accent-primary)' : 'var(--grey-100)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: idx === 0 ? '#fff' : 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              {item.type}
            </div>
            <div style={{
              fontSize: '12px',
              color: idx === 0 ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
            }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Writing Area */}
      <div style={{
        backgroundColor: 'var(--grey-50)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        minHeight: '200px'
      }}>
        <textarea
          placeholder="Start writing or describe what you want to create..."
          style={{
            width: '100%',
            minHeight: '160px',
            border: 'none',
            backgroundColor: 'transparent',
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--grey-300)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}>
            Improve
          </button>
          <button style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--grey-300)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}>
            Shorten
          </button>
          <button style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--grey-300)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}>
            Expand
          </button>
        </div>
        <button style={{
          backgroundColor: 'var(--accent-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          Generate
        </button>
      </div>
    </div>
  )
}

export default WritingAgent
