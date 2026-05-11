const { ToolError, fetchJson } = require("../utils/http");

async function searchWeb({ query, signal }) {
  if (!process.env.TAVILY_API_KEY) {
    throw new ToolError("TAVILY_API_KEY is required for destination search", {
      tool: "searchWeb",
      retryable: false,
    });
  }

  const data = await fetchJson("https://api.tavily.com/search", {
    tool: "searchWeb",
    timeoutMs: 12000,
    signal,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "basic",
    }),
  });

  if (Array.isArray(data?.results)) {
    return data.results.slice(0, 3).map((result) => ({
      title: result.title,
      content: result.content,
    }));
  }

  return [];
}

module.exports = { searchWeb };
