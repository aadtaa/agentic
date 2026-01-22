import React, { useRef } from 'react'
import { Wordmark } from './Logo'

const Header = ({ onToggleSidebar, onFileUpload }) => {
  const fileInputRef = useRef(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check for valid file types
      const validTypes = ['.tcx', '.fit', '.gpx']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

      if (validTypes.includes(fileExtension)) {
        if (onFileUpload) {
          onFileUpload(file)
        } else {
          console.log('File selected:', file.name, file.size, 'bytes')
          // TODO: Implement file upload to backend
          alert(`File "${file.name}" selected. Upload functionality coming soon!`)
        }
      } else {
        alert('Please select a TCX, FIT, or GPX file')
      }

      // Reset input so same file can be selected again
      event.target.value = ''
    }
  }

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

      {/* Upload Button */}
      <button
        onClick={handleUploadClick}
        style={{
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2V10M8 2L5 5M8 2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 10V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Upload
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".tcx,.fit,.gpx"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </header>
  )
}

export default Header
