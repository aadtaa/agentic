// Direct table query endpoint for Data Viewer
import { queryTable } from './lib/data-collector.js'

export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { table_name, date_range, limit } = JSON.parse(event.body)

    if (!table_name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'table_name is required' })
      }
    }

    const result = await queryTable(table_name, {
      dateRange: date_range,
      limit: limit || 100
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    }
  } catch (error) {
    console.error('Query table error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message || 'Query failed' })
    }
  }
}
