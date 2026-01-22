// Netlify Function: Chat with AI
// Uses Supabase for data and can be extended with any LLM provider

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

    // Environment variables from Netlify
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    // Placeholder response - integrate with your preferred LLM provider
    // Options: OpenAI, Anthropic Claude, Supabase Edge Functions with AI, etc.

    const response = generateResponse(message, history)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: response,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Chat function error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

// Placeholder response generator - replace with actual LLM integration
function generateResponse(message, history) {
  const lowerMessage = message.toLowerCase()

  // Simple pattern matching for demo
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI assistant. How can I help you today? I can help with data analysis, writing code, research, and more."
  }

  if (lowerMessage.includes('analyze') || lowerMessage.includes('data')) {
    return "I'd be happy to help you analyze data! You can:\n\n1. Upload a CSV or JSON file to the Data Analysis agent\n2. Describe the data you want to analyze\n3. Ask specific questions about patterns or insights\n\nWhat kind of data would you like to work with?"
  }

  if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
    return "I can help with coding! Here's what I can do:\n\n• Generate code in any language\n• Debug existing code\n• Explain code snippets\n• Optimize performance\n• Write tests\n\nWhat programming task can I help you with?"
  }

  if (lowerMessage.includes('write') || lowerMessage.includes('content')) {
    return "I'm ready to help with writing! I can assist with:\n\n• Blog posts and articles\n• Professional emails\n• Reports and documentation\n• Creative writing\n• Editing and proofreading\n\nWhat would you like to write?"
  }

  if (lowerMessage.includes('research') || lowerMessage.includes('learn')) {
    return "I can help you research any topic! Just tell me what you'd like to learn about, and I'll provide comprehensive information, key insights, and relevant resources."
  }

  // Default response
  return `I understand you're asking about: "${message}"\n\nTo provide you with the best assistance, I can help you with:\n\n• **Data Analysis** - Upload and analyze datasets\n• **Code Assistant** - Write, debug, or explain code\n• **Research** - Deep dive into any topic\n• **Writing** - Create and edit content\n\nWhich area would you like to explore?`
}
