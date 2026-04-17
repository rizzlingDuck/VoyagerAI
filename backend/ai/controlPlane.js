const { ChatGroq } = require('@langchain/groq');
const { getCoordinates } = require('../tools/geocode');
const { findFlights } = require('../tools/flights');
const { searchWeb } = require('../tools/search');
const { searchHotels } = require('../tools/hotels');

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

/**
 * Control Plane core execution logic.
 * Parses the Boss's query into tool calls, executes them in parallel, and returns the raw JSON.
 */
async function ask_control_plane({ query }) {
  console.log(`\n[Control Plane - 8b] Received query from Boss: => "${query}"`);
  
  try {
    const plannerPrompt = `The main orchestrator has requested real-world data: "${query}". 
Return a strict JSON array of objects detailing the tools you need to call to get real-world data to fulfill this request. The array must contain objects with toolName and params. 

Available tools: 
- findFlights (needs originCode, destCode, departureDate YYYY-MM-DD, returnDate YYYY-MM-DD)
- getCoordinates (needs locationName)
- searchWeb (needs query)
- searchHotels (needs locationName, budgetLevel)

CRITICAL RULE: If the request implies specific activities, tourist attractions, or hotels, you MUST add a getCoordinates task for those specific place names to the tool list. We need exact map pins.

Output ONLY valid JSON, no markdown blocks or conversational text. Example: [{"toolName": "searchWeb", "params": {"query": "weather"}}]`;

    console.log('[Control Plane - 8b] Sending Planner Prompt...');
    const plannerResult = await cpLLM.invoke([{ role: 'user', content: plannerPrompt }]);
    
    // Clean response of any markdown formatting
    const rawPlannerResult = typeof plannerResult.content === 'string' ? plannerResult.content : plannerResult.content[0].text;
    const cleanJsonString = rawPlannerResult.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    
    const toolRequests = JSON.parse(cleanJsonString);
    console.log(`[Control Plane - 8b] Planner proposed ${toolRequests.length} tool calls.`);

    console.log('[Control Plane - 8b] Executing tools in parallel...');
    
    const gatheredData = await Promise.all(
      toolRequests.map(async (req) => {
        const { toolName, params } = req;
        const toolFn = toolRegistry[toolName];
        
        if (!toolFn) return { tool: toolName, error: 'Unknown tool' };

        try {
          const args = Object.values(params); 
          const result = await toolFn(...args);
          return { tool: toolName, params, result };
        } catch (err) {
          console.error(`[Control Plane - 8b] Tool ${toolName} failed:`, err.message);
          return { tool: toolName, params, error: 'Timeout or Fetch Failed' };
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

module.exports = { ask_control_plane };
