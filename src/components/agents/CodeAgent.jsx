import React from 'react'

const CodeAgent = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '8px'
      }}>
        Code Assistant Agent
      </h2>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '24px'
      }}>
        Generate, review, and debug code with AI assistance.
      </p>

      {/* Code Editor Placeholder */}
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '24px',
        fontFamily: 'Monaco, Consolas, monospace'
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27ca40' }} />
        </div>
        <pre style={{
          color: '#d4d4d4',
          fontSize: '13px',
          lineHeight: 1.6,
          margin: 0,
          overflow: 'auto'
        }}>
{`// Welcome to Code Agent
// Start typing or paste your code here

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`}
        </pre>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {['Generate Code', 'Explain Code', 'Debug', 'Optimize', 'Add Tests'].map((action, idx) => (
          <button key={idx} style={{
            backgroundColor: idx === 0 ? 'var(--accent-primary)' : 'var(--grey-100)',
            color: idx === 0 ? '#fff' : 'var(--text-primary)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CodeAgent
