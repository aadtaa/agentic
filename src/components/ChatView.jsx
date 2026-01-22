import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Logo from './Logo'

const ChatView = () => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const quickActions = [
    { label: "Analyze Data", prompt: "Help me analyze my data" },
    { label: "Write Code", prompt: "Help me write some code" },
    { label: "Explain Concept", prompt: "Explain this concept to me" },
    { label: "Generate Ideas", prompt: "Help me brainstorm ideas" },
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

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history })
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Unable to connect. Please check your connection and try again.'
      }])
    } finally {
      setIsLoading(false)
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
      {/* Chat Content - Centered */}
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
                    <div style={{ marginBottom: '24px' }} className="markdown-content">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
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
                    <span className="typing-dots">Thinking</span>
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
              <Logo size={56} color="var(--text-primary)" />
              <h1 style={{
                fontSize: '36px',
                fontWeight: 400,
                color: 'var(--text-primary)',
                margin: '32px 0 0 0',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}>
                Your AI-Powered<br />
                <span style={{ fontWeight: 700 }}>Agent Dashboard.</span>
              </h1>
              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                maxWidth: '400px',
                lineHeight: 1.6,
                margin: '20px 0 0 0',
              }}>
                Chat with intelligent agents to help with your tasks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input Section - Fixed at bottom, centered */}
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
              placeholder="Ask anything..."
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
                style={{
                  backgroundColor: 'var(--grey-100)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-200)'}
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

export default ChatView
