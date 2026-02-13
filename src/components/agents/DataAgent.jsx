import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const DataAgent = () => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const quickActions = [
    { label: "Training Load", prompt: "Analyze my current training load — CTL, ATL, TSB, and form status" },
    { label: "Power Profile", prompt: "Show my 7-axis performance profile with strengths and weaknesses" },
    { label: "Sleep Trends", prompt: "Analyze my sleep data from the last 7 days" },
    { label: "Recent Activities", prompt: "Summarize my activities from the last 30 days" },
    { label: "Race Readiness", prompt: "Am I ready for my next race? Check form, sleep, and wellness." },
    { label: "Weekly Summary", prompt: "Give me a complete summary of my training this week" },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: messageText }])
    setIsLoading(true)
    setLoadingStage('Planning data retrieval...')

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))

      // Simulate stage progression for UX
      const stageTimer1 = setTimeout(() => setLoadingStage('Querying databases...'), 800)
      const stageTimer2 = setTimeout(() => setLoadingStage('Inspecting results...'), 2000)
      const stageTimer3 = setTimeout(() => setLoadingStage('Synthesizing response...'), 3500)

      const response = await fetch('/.netlify/functions/data-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history })
      })

      clearTimeout(stageTimer1)
      clearTimeout(stageTimer2)
      clearTimeout(stageTimer3)

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          pipeline: data.pipeline || null
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Sorry, I encountered an error. Please try again.'
        }])
      }
    } catch (error) {
      console.error('Data agent error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Unable to connect. Please check your connection and try again.'
      }])
    } finally {
      setIsLoading(false)
      setLoadingStage('')
    }
  }

  const handleSend = () => {
    if (!inputValue.trim()) return
    const message = inputValue.trim()
    setInputValue('')
    sendMessage(message)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Chat Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          padding: '20px 24px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {hasMessages ? (
            <div style={{ flex: 1 }}>
              {messages.map((msg, idx) => (
                <div key={idx}>
                  {msg.role === 'user' ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: '24px',
                    }}>
                      <div style={{
                        backgroundColor: 'var(--grey-100)',
                        borderRadius: '20px',
                        padding: '12px 20px',
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                        maxWidth: '80%',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '24px' }}>
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {/* Pipeline metadata */}
                      {msg.pipeline && <PipelineInfo pipeline={msg.pipeline} />}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{
                    fontSize: '15px',
                    color: 'var(--text-tertiary)',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    <span className="typing-dots">{loadingStage || 'Analyzing'}</span>
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}>
              {/* Data Analysis Icon */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                backgroundColor: 'var(--grey-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M4 22L9 14L14 17L19 9L24 12" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="14" r="2" fill="var(--accent-primary)"/>
                  <circle cx="14" cy="17" r="2" fill="var(--accent-primary)"/>
                  <circle cx="19" cy="9" r="2" fill="var(--accent-primary)"/>
                </svg>
              </div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 400,
                color: 'var(--text-primary)',
                margin: '32px 0 0 0',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}>
                Data Analysis<br />
                <span style={{ fontWeight: 700 }}>Agent.</span>
              </h1>
              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                maxWidth: '420px',
                lineHeight: 1.6,
                margin: '20px 0 0 0',
              }}>
                4-stage pipeline: Plan, Execute, Inspect, Synthesize. Ask about trends, compare metrics, and uncover patterns in your training data.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div style={{
        padding: '24px',
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--grey-100)',
      }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
        }}>
          {/* Input Box */}
          <div style={{
            backgroundColor: 'var(--grey-100)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '16px',
          }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about your data..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontFamily: 'inherit',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '16px',
            }}>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  backgroundColor: inputValue.trim() && !isLoading ? 'var(--accent-primary)' : 'var(--grey-300)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}>
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(action.prompt)}
                disabled={isLoading}
                style={{
                  backgroundColor: 'var(--grey-100)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  cursor: isLoading ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.2s',
                  opacity: isLoading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--grey-200)' }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-100)'}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Pipeline Info Component — shows timing and metadata
// ─────────────────────────────────────────────

const PipelineInfo = ({ pipeline }) => {
  const [expanded, setExpanded] = useState(false)

  if (!pipeline) return null

  const timing = pipeline.timing || {}
  const discoveries = pipeline.discoveries || []
  const dataQuality = pipeline.data_quality_notes || []
  const planner = pipeline.planner || {}

  return (
    <div style={{
      marginTop: '12px',
      borderTop: '1px solid var(--grey-100)',
      paddingTop: '12px',
    }}>
      {/* Collapsed: just timing bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          fontFamily: 'inherit',
        }}
      >
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Timing pills */}
          {timing.planner_ms && (
            <TimingPill label="Plan" ms={timing.planner_ms} />
          )}
          {timing.executor_ms && (
            <TimingPill label="Query" ms={timing.executor_ms} />
          )}
          {timing.inspector_ms && (
            <TimingPill label="Inspect" ms={timing.inspector_ms} />
          )}
          {timing.additional_executor_ms > 0 && (
            <TimingPill label="Follow-up" ms={timing.additional_executor_ms} />
          )}
          {timing.synthesizer_ms && (
            <TimingPill label="Synth" ms={timing.synthesizer_ms} />
          )}
          {timing.total_ms && (
            <span style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              marginLeft: '4px',
            }}>
              {(timing.total_ms / 1000).toFixed(1)}s total
            </span>
          )}

          {discoveries.length > 0 && (
            <span style={{
              fontSize: '12px',
              color: 'var(--accent-primary)',
              fontWeight: 600,
            }}>
              {discoveries.length} discovery{discoveries.length !== 1 ? 'ies' : 'y'}
            </span>
          )}
        </div>

        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{
            marginLeft: 'auto',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <path d="M3 5L6 8L9 5" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded: full pipeline details */}
      {expanded && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--grey-50, #f8f8fa)',
          borderRadius: '12px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          {/* Planner reasoning */}
          {planner.reasoning && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Planner Reasoning
              </div>
              <div>{planner.reasoning}</div>
              {planner.domains && (
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {planner.domains.map((d, i) => (
                    <span key={i} style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      backgroundColor: 'var(--grey-100)',
                      borderRadius: '8px',
                      color: 'var(--text-tertiary)',
                    }}>{d}</span>
                  ))}
                </div>
              )}
              {planner.functions_planned && (
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {planner.functions_planned.map((f, i) => (
                    <span key={i} style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      backgroundColor: 'var(--grey-200, #e8e8ec)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                    }}>{f}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discoveries */}
          {discoveries.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Inspector Discoveries
              </div>
              {discoveries.map((d, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  marginBottom: '6px',
                  backgroundColor: d.priority === 'high' ? '#fff3f0' : 'var(--grey-100)',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${d.priority === 'high' ? '#e74c3c' : d.priority === 'medium' ? '#f39c12' : 'var(--grey-300)'}`,
                }}>
                  <div style={{ fontWeight: 500 }}>{d.finding}</div>
                  {d.evidence && <div style={{ fontSize: '12px', marginTop: '2px' }}>Evidence: {d.evidence}</div>}
                  {d.implication && <div style={{ fontSize: '12px', marginTop: '2px', fontStyle: 'italic' }}>{d.implication}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Data quality notes */}
          {dataQuality.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Data Quality Notes
              </div>
              {dataQuality.map((note, i) => (
                <div key={i} style={{ fontSize: '12px', marginBottom: '2px' }}>- {note}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TimingPill = ({ label, ms }) => (
  <span style={{
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: 'var(--grey-100)',
    borderRadius: '8px',
    color: 'var(--text-tertiary)',
    whiteSpace: 'nowrap',
  }}>
    {label} {ms}ms
  </span>
)

export default DataAgent
