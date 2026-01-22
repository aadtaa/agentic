import React from 'react'

export const Logo = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="2" />
    <path
      d="M10 16L14 20L22 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Wordmark = ({ height = 20, color = 'currentColor' }) => (
  <svg height={height} viewBox="0 0 100 24" fill="none">
    <text
      x="0"
      y="18"
      fill={color}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="20"
      fontWeight="600"
      letterSpacing="-0.02em"
    >
      AGENTIC
    </text>
  </svg>
)

export default Logo
