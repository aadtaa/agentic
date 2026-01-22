import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatView from './ChatView'
import FloatingAssistant from './FloatingAssistant'
import DataAgent from './agents/DataAgent'
import CodeAgent from './agents/CodeAgent'
import ResearchAgent from './agents/ResearchAgent'
import WritingAgent from './agents/WritingAgent'
import DataViewer from './DataViewer'
import Logo from './Logo'

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState('chat')
  const [activeView, setActiveView] = useState('chat')
  const [isViewLoading, setIsViewLoading] = useState(false)

  const navItems = [
    {
      id: 'chat',
      label: 'Chat',
      appView: 'chat',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M15 9C15 12.3137 12.3137 15 9 15C7.93913 15 6.94348 14.7261 6.08 14.24L3 15L3.76 11.92C3.27391 11.0565 3 10.0609 3 9C3 5.68629 5.68629 3 9 3C12.3137 3 15 5.68629 15 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 'data',
      label: 'Data Analysis',
      appView: 'data',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 14L6 9L9 11L12 6L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="9" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="11" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'dataviewer',
      label: 'Data Viewer',
      appView: 'dataviewer',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 7H15M7 7V15" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    },
    {
      id: 'code',
      label: 'Code Assistant',
      appView: 'code',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6 5L3 9L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 5L15 9L12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 3L8 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'research',
      label: 'Research',
      appView: 'research',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'writing',
      label: 'Writing',
      appView: 'writing',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M12.5 3.5L14.5 5.5L6 14H4V12L12.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 'history',
      label: 'History',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 6V9L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 3V5M9 13V15M15 9H13M5 9H3M13.24 4.76L11.83 6.17M6.17 11.83L4.76 13.24M13.24 13.24L11.83 11.83M6.17 6.17L4.76 4.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
  ]

  const handleNavClick = (item) => {
    setActiveNav(item.id)

    if (item.appView) {
      // Show loading for agent views
      if (item.appView !== 'chat') {
        setIsViewLoading(true)
        setTimeout(() => {
          setIsViewLoading(false)
          setActiveView(item.appView)
        }, 800)
      } else {
        setActiveView(item.appView)
      }
    }
  }

  const renderView = () => {
    switch (activeView) {
      case 'data':
        return <DataAgent />
      case 'dataviewer':
        return <DataViewer />
      case 'code':
        return <CodeAgent />
      case 'research':
        return <ResearchAgent />
      case 'writing':
        return <WritingAgent />
      case 'chat':
      default:
        return <ChatView />
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'var(--font-sans)',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        activeNav={activeNav}
        onNavClick={handleNavClick}
        navItems={navItems}
      />

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Loading Overlay */}
          {isViewLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div className="animate-pulse">
                <Logo size={64} color="var(--text-primary)" />
              </div>
            </div>
          )}

          {/* View Content */}
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            {renderView()}

            {/* Floating Assistant - shown on agent views */}
            {activeView !== 'chat' && (
              <FloatingAssistant
                placeholder={`Ask about ${activeView}...`}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
