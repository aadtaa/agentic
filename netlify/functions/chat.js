// Netlify Function: Chat with Claude Opus
// Integrates with Anthropic's Claude API for AI-powered conversations

import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a helpful AI assistant powering an agent dashboard. You help users with:
- Data analysis and insights
- Writing and editing code
- Research and learning
- Content creation and writing

Be concise, helpful, and friendly. Format responses with markdown when appropriate for better readability.`

export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { message, history = [] } = JSON.parse(event.body)

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
      }
    }

    // Check for Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI service not configured. Please set ANTHROPIC_API_KEY.' })
      }
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey
    })

    // Convert history to Anthropic message format
    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Add the current user message
    messages.push({
      role: 'user',
      content: message
    })

    // Call Claude Opus API
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages
    })

    // Extract the text response
    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: assistantMessage,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Chat function error:', error)

    // Handle specific Anthropic API errors
    if (error.status === 401) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.' })
      }
    }

    if (error.status === 429) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' })
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while processing your request.' })
    }
  }
}
