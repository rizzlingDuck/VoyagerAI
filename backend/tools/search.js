async function searchWeb({ query }) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: 'basic'
      })
    });

    const data = await response.json();

    if (data.results && Array.isArray(data.results)) {
      return data.results.slice(0, 3).map(result => ({
        title: result.title,
        content: result.content
      }));
    }

    return [];
  } catch (error) {
    console.error('Web Search Error:', error);
    return [];
  }
}

module.exports = { searchWeb };
