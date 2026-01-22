import React from 'react'

const Sidebar = ({ isOpen, activeNav, onNavClick, navItems }) => {
  return (
    <aside style={{
      width: isOpen ? '220px' : '0px',
      backgroundColor: 'var(--grey-100)',
      borderRight: isOpen ? '1px solid var(--grey-200)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      padding: isOpen ? '12px' : '0',
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavClick(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: activeNav === item.id ? 'var(--grey-200)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              color: activeNav === item.id ? 'var(--accent-primary)' : 'var(--text-primary)',
              transition: 'all 0.15s ease',
              opacity: isOpen ? 1 : 0
            }}
          >
            {item.icon}
            <span style={{ fontSize: '14px', fontWeight: activeNav === item.id ? 500 : 400 }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          marginTop: 'auto',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'background-color 0.15s ease',
          opacity: isOpen ? 1 : 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-200)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          U
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>User</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Settings</div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
