import React from 'react'
import { Wordmark } from './Logo'

const Header = ({ onToggleSidebar }) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      borderBottom: '1px solid var(--grey-200)',
      flexShrink: 0,
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '6px',
          color: 'var(--text-primary)'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 4V16" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </button>

      {/* Center - Logo */}
      <Wordmark height={18} color="var(--text-primary)" />

      {/* Sign Up Button */}
      <button style={{
        backgroundColor: 'var(--accent-primary)',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        padding: '8px 20px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}>
        Sign Up
      </button>
    </header>
  )
}

export default Header
