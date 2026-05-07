const { ChatGroq } = require('@langchain/groq');
const { getCoordinates } = require('../tools/geocode');
const { findFlights } = require('../tools/flights');
const { searchWeb } = require('../tools/search');
const { searchHotels } = require('../tools/hotels');
const { ToolRequestSchema } = require('./schemas');
const { withRetry } = require('../utils/retry');

// The Control Plane uses a faster, smaller model strictly for tool orchestration
const cpLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  modelName: "llama-3.1-8b-instant",
  temperature: 0
});

// Tool registry for parallel execution
const toolRegistry = {
  getCoordinates,
  findFlights,
  searchWeb,
  searchHotels,
};

// Friendly display names for streaming events
const TOOL_LABELS = {
  findFlights: "Searching flights",
  searchHotels: "Finding hotels",
  getCoordinates: "Mapping locations",
  searchWeb: "Researching destination",
};

/**
 * Control Plane core execution logic.
 * Parses the Boss's query into tool calls, executes them in parallel, and returns the raw JSON.
 * @param {Object} params
 * @param {string} params.query - The Boss Agent's data request
 * @param {Function} [onEvent] - Optional SSE callback for streaming progress
 */
async function ask_control_plane({ query }, onEvent) {
  console.log(`\n[Control Plane - 8b] Received query from Boss: => "${query}"`);
  
  try {
    const plannerPrompt = `The main orchestrator has requested real-world data: "${query}". 
Return a strict JSON array of objects detailing the tools you need to call to get real-world data to fulfill this request. The array must contain objects with toolName and params. 

Available tools: 
- findFlights (needs originCode, destCode, departureDate YYYY-MM-DD, returnDate YYYY-MM-DD)
- getCoordinates (needs locationName)
- searchWeb (needs query)
- searchHotels (needs locationName, budgetLevel, checkinDate YYYY-MM-DD, checkoutDate YYYY-MM-DD)

CRITICAL RULE: If the request implies specific activities, tourist attractions, or hotels, you MUST add a getCoordinates task for those specific place names to the tool list. We need exact map pins.

Output ONLY valid JSON, no markdown blocks or conversational text. Example: [{"toolName": "searchWeb", "params": {"query": "weather"}}]`;

    console.log('[Control Plane - 8b] Sending Planner Prompt...');
    onEvent?.("status", { phase: "planning", message: "AI is analyzing what data to fetch..." });
    
    const plannerResult = await cpLLM.invoke([{ role: 'user', content: plannerPrompt }]);
    
    // Clean response of any markdown formatting
    const rawPlannerResult = typeof plannerResult.content === 'string'
      ? plannerResult.content
      : plannerResult.content[0].text;
    const cleanJsonString = rawPlannerResult
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // ── Structured validation (replaces raw JSON.parse) ──────────────────────
    let toolRequests;
    try {
      const parsed = JSON.parse(cleanJsonString);
      const validated = ToolRequestSchema.safeParse(parsed);

      if (validated.success) {
        toolRequests = validated.data;
      } else {
        // Log issues but degrade gracefully — run whatever valid entries exist
        console.warn('[Control Plane - 8b] Schema validation issues:', validated.error.flatten());
        // Filter the raw parsed array to only valid entries
        toolRequests = Array.isArray(parsed)
          ? parsed.filter(r => r.toolName && toolRegistry[r.toolName] && r.params)
          : [];
      }
    } catch (parseErr) {
      console.error('[Control Plane - 8b] Failed to parse planner JSON:', parseErr.message);
      console.error('[Control Plane - 8b] Raw planner output:', rawPlannerResult);
      toolRequests = [];
    }

    console.log(`[Control Plane - 8b] Planner proposed ${toolRequests.length} tool calls.`);
    onEvent?.("status", { phase: "fetching", message: `Fetching data from ${toolRequests.length} sources...` });

    console.log('[Control Plane - 8b] Executing tools in parallel...');
    
    const gatheredData = await Promise.all(
      toolRequests.map(async (req) => {
        const { toolName, params } = req;
        const toolFn = toolRegistry[toolName];
        
        if (!toolFn) return { tool: toolName, error: 'Unknown tool' };

        // Emit tool_start event
        const label = TOOL_LABELS[toolName] || toolName;
        onEvent?.("tool_start", { tool: toolName, label, params });

        try {
          // ── Retry with exponential backoff (3 attempts: 500ms → 1s → 2s) ──
          const result = await withRetry(
            () => toolFn(params),
            { maxAttempts: 3, baseDelayMs: 500, label: `${toolName}` }
          );

          // Emit tool_complete with a preview of the results
          const preview = buildToolPreview(toolName, result);
          onEvent?.("tool_complete", { tool: toolName, label, preview });
          
          return { tool: toolName, params, result };
        } catch (err) {
          console.error(`[Control Plane - 8b] Tool ${toolName} failed after retries:`, err.message);
          onEvent?.("tool_error", { tool: toolName, label, error: err.message });
          // Mark with _dataUnavailable so Boss discloses failure rather than fabricating silently
          return { tool: toolName, params, error: `Failed to fetch data: ${err.message}`, _dataUnavailable: true };
        }
      })
    );

    console.log('[Control Plane - 8b] Tool execution complete. Returning raw data to Boss.');
    return JSON.stringify(gatheredData, null, 2);
  } catch (error) {
    console.error('[Control Plane - 8b] Error:', error);
    return JSON.stringify({ error: "Control plane execution failed due to an internal error." });
  }
}

/**
 * Build a user-friendly preview of tool results for streaming display.
 */
function buildToolPreview(toolName, result) {
  try {
    switch (toolName) {
      case "findFlights": {
        if (!result || !result.flights) return { count: 0, summary: "No flights found" };
        const flights = result.flights.slice(0, 3);
        return {
          count: result.flights.length,
          items: flights.map(f => ({
            airline: f.airline || "Unknown",
            price: f.price || "N/A",
            currency: f.currency || "USD",
          })),
        };
      }
      case "searchHotels": {
        if (!result || !Array.isArray(result)) return { count: 0, summary: "No hotels found" };
        const hotels = result.slice(0, 3);
        return {
          count: result.length,
          items: hotels.map(h => ({
            name: h.name || "Unknown",
            rating: h.rating || "N/A",
            price: h.price || "N/A",
          })),
        };
      }
      case "getCoordinates": {
        if (!result) return { summary: "Location not found" };
        return { lat: result.lat, lng: result.lng, name: result.display_name || "Found" };
      }
      case "searchWeb": {
        if (!result || !result.results) return { count: 0, summary: "No results" };
        return { count: result.results.length, summary: `Found ${result.results.length} sources` };
      }
      default:
        return { summary: "Completed" };
    }
  } catch {
    return { summary: "Completed" };
  }
}

module.exports = { ask_control_plane };
