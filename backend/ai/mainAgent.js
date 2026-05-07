const { ChatGroq } = require('@langchain/groq');
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { ask_control_plane } = require("./controlPlane");
const { ItinerarySchema } = require("./schemas");

// The Main Agent ('The Boss') uses the powerful versatile model for reasoning and synthesis
const bossLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  modelName: "llama-3.3-70b-versatile",
  temperature: 0
});

/**
 * Main orchestrator workflow.
 * @param {string} destination
 * @param {string} origin
 * @param {number} days
 * @param {Object} options
 * @param {Function} [onEvent] - Optional SSE callback for streaming progress
 */
async function generateItinerary(destination, origin, days, options = {}, onEvent) {
  const { interests, budgetLevel, pace, guests, startDate, endDate } = options;
  const prefsText = [
    guests ? `Travelers: ${guests}` : '',
    budgetLevel ? `Budget level: ${budgetLevel}` : '',
    pace ? `Travel pace: ${pace}` : '',
    interests ? `Interests: ${interests}` : ''
  ].filter(Boolean).join('. ');
  
  console.log(`\n[Main Agent - Boss] Starting CPaaT Workflow for ${destination} from ${origin || 'unspecified'} (${days} days)`);
  
  // Wrap the Control Plane as a LangChain Tool, passing through the onEvent callback
  const controlPlaneTool = tool(
    async ({ query }) => {
      return await ask_control_plane({ query }, onEvent);
    },
    {
      name: "ask_control_plane",
      description: "Fetches all necessary real-world data (flights, hotels, map coordinates, web search). You MUST use this tool to gather information before creating the final itinerary.",
      schema: z.object({
        query: z.string().describe("A detailed instruction to the control plane about what data to fetch (e.g., 'Find flights from NYC to TYO, hotels in TYO, and exact coordinates for Tokyo Tower')."),
      })
    }
  );

  // Bind the single tool to the Boss LLM
  const bossWithTools = bossLLM.bindTools([controlPlaneTool]);

  try {
    // ==========================================
    // PHASE 1: BOSS REASONING & DATA DELEGATION
    // ==========================================
    onEvent?.("status", { phase: "reasoning", message: "AI is reasoning about your trip..." });

    const userPrompt = `I want to travel${origin ? ` from ${origin}` : ''} to ${destination} for ${days} days. ${prefsText ? `Preferences: ${prefsText}.` : ''} 
You are the Boss Agent. You MUST use the ask_control_plane tool to fetch real-world data (flights, hotels, locations, coordinates) for this trip. 
The user is traveling exactly from ${startDate} to ${endDate}. When you ask the Control Plane for flight data, you MUST provide these exact dates.
Pass a detailed query explaining exactly what you need compiled for this trip.`;

    console.log('[Main Agent - Boss] Evaluating task and invoking Control Plane...');
    const msg1 = await bossWithTools.invoke([{ role: 'user', content: userPrompt }]);
    
    let rawToolData = "{}";
    
    if (msg1.tool_calls && msg1.tool_calls.length > 0) {
      const toolCall = msg1.tool_calls[0];
      console.log(`[Main Agent - Boss] Calling tool: ${toolCall.name} with query: "${toolCall.args.query}"`);
      rawToolData = await controlPlaneTool.invoke(toolCall.args);
    } else {
      console.log('[Main Agent - Boss] WARNING: Boss decided not to use tool. Passing empty data.');
      rawToolData = "[]";
    }

    // ==========================================
    // PHASE 2: FINAL SYNTHESIS
    // ==========================================
    onEvent?.("status", { phase: "synthesizing", message: "Crafting your personalized itinerary..." });

    const synthesizerPrompt = buildSynthesizerPrompt(rawToolData, destination, days, startDate, endDate, pace, guests, interests);

    console.log('[Main Agent - Boss] Performing final synthesis based on gathered data...');
    const synthesizerResult = await bossLLM.invoke([{ role: 'user', content: synthesizerPrompt }]);

    const rawSynthResult = typeof synthesizerResult.content === 'string'
      ? synthesizerResult.content
      : synthesizerResult.content[0].text;
    const cleanFinalJson = rawSynthResult.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    // ── Structured validation (replaces raw JSON.parse) ──────────────────────
    console.log('[Main Agent - Boss] Parsing and validating final itinerary...');
    let finalItinerary = await parseAndValidateItinerary(cleanFinalJson, destination, days, startDate, endDate, pace, guests, interests);

    return finalItinerary;

  } catch (error) {
    console.error('[Main Agent - Boss] Workflow Failed:', error);
    
    return {
      destination: destination,
      centerCoordinates: [0, 0],
      budget_used: "Error retrieving data",
      mapMarkers: [],
      flights: [],
      hotels: [],
      days: [
        {
          day: 1,
          theme: "API Overload Notice",
          activities: [
            {
              time: "N/A",
              location: "Error Generated Itinerary",
              description: "Our AI systems experienced unexpected downtime running the CPaaT flow. Please try again later.",
              cost: "$0",
              coordinates: [0, 0],
              category: "attraction",
            }
          ]
        }
      ]
    };
  }
}

/**
 * Attempt to parse + Zod-validate the itinerary JSON.
 * If validation fails, fire a repair prompt to the LLM once and try again.
 */
async function parseAndValidateItinerary(rawJson, destination, days, startDate, endDate, pace, guests, interests) {
  // ── First attempt ─────────────────────────────────────────────────────────
  try {
    const parsed = JSON.parse(rawJson);
    const validated = ItinerarySchema.safeParse(parsed);

    if (validated.success) {
      console.log('[Main Agent - Boss] Itinerary passed Zod validation.');
      return validated.data;
    }

    // Log schema errors, attempt repair
    const errorSummary = validated.error.flatten();
    console.warn('[Main Agent - Boss] Itinerary failed schema validation:', JSON.stringify(errorSummary, null, 2));
    console.log('[Main Agent - Boss] Firing repair prompt...');

    return await repairItinerary(rawJson, errorSummary, destination, days, startDate, endDate, pace, guests, interests);

  } catch (parseErr) {
    console.error('[Main Agent - Boss] Failed to parse itinerary JSON:', parseErr.message);
    console.log('[Main Agent - Boss] Firing repair prompt...');
    return await repairItinerary(rawJson, { _parseError: parseErr.message }, destination, days, startDate, endDate, pace, guests, interests);
  }
}

/**
 * Send the broken JSON + error context back to the LLM for structural repair.
 * Falls back to a hardcoded error object if repair also fails.
 */
async function repairItinerary(brokenJson, errors, destination, days, startDate, endDate, pace, guests, interests) {
  try {
    const repairPrompt = `The following JSON itinerary has structural issues that must be fixed:

ERRORS:
${JSON.stringify(errors, null, 2)}

BROKEN JSON (first 3000 chars):
${brokenJson.slice(0, 3000)}

Fix ONLY the structural/schema issues listed above. Do not change the trip content.
Output ONLY valid JSON that satisfies the schema. No markdown, no commentary.`;

    const repairResult = await bossLLM.invoke([{ role: 'user', content: repairPrompt }]);
    const rawRepair = typeof repairResult.content === 'string'
      ? repairResult.content
      : repairResult.content[0].text;
    const cleanRepair = rawRepair.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    const parsedRepair = JSON.parse(cleanRepair);
    const revalidated = ItinerarySchema.safeParse(parsedRepair);

    if (revalidated.success) {
      console.log('[Main Agent - Boss] Repair successful — itinerary passed schema validation.');
      return revalidated.data;
    }

    // Repair also failed — use lenient fallback: return raw parsed object
    console.warn('[Main Agent - Boss] Repair attempt still failed schema. Returning parsed object as-is.');
    return parsedRepair;

  } catch (err) {
    console.error('[Main Agent - Boss] Repair prompt failed:', err.message);
    // Last resort — return a minimal valid error object
    return {
      destination,
      centerCoordinates: [0, 0],
      budget_used: "Could not estimate",
      mapMarkers: [],
      flights: [{ airline: "Data unavailable", price: "N/A", currency: "USD", departureDate: startDate || "", returnDate: endDate || "" }],
      hotels: [{ name: "Data unavailable", rating: "N/A", price: "N/A", currency: "USD", lat: 0, lng: 0 }],
      days: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        theme: "Itinerary data could not be generated",
        activities: [{
          time: "N/A",
          location: "Please try again",
          category: "attraction",
          description: "The AI had trouble structuring the itinerary. Please try your request again.",
          coordinates: [0, 0],
        }]
      })),
    };
  }
}

function buildSynthesizerPrompt(rawToolData, destination, days, startDate, endDate, pace, guests, interests) {
  return `Here is the real-world data fetched by your Control Plane:
${rawToolData}

Note: Any tool result with "_dataUnavailable: true" means that data source failed after multiple retries. For those sections, clearly mark the data as estimated (e.g., "~$500 est." for prices) rather than presenting it as real.

Using this data, create a detailed, day-by-day JSON itinerary for a trip to ${destination}. If any tool data is empty, errored, or missing, you MUST fabricate realistic placeholder data (e.g., invent 2-3 plausible airlines with estimated prices for flights, and 2-3 plausible hotels with estimated nightly rates). The flights and hotels arrays must NEVER be empty.

## Strict Constraints
${pace ? `- You must strictly adhere to the user's Pace setting: ${pace}. If Relax, max 2 activities a day. If Active, pack the schedule.` : ''}
${guests ? `- Tailor the language and activity selection to the Guest type: ${guests}.` : ''}
${interests ? `- Filter the gathered data to match the Interests: ${interests}.` : ''}

Ensure the output STRICTLY matches this exact JSON schema:
{
  "destination": "City Name, Country",
  "overview": "A 2-3 sentence compelling description of the destination for travelers.",
  "centerCoordinates": [latitude, longitude],
  "budget_used": "$X,XXX estimated",
  "currency": "Local currency code e.g. EUR",
  "timezone": "e.g. GMT+05:30",
  "mapMarkers": [
    { "title": "Name of Place", "lat": latitude_number, "lng": longitude_number, "type": "hotel" },
    { "title": "Activity Name", "lat": latitude_number, "lng": longitude_number, "type": "activity", "day": 1 }
  ],
  "flights": [
    { "airline": "Airline Name", "price": 100, "currency": "USD", "departureDate": "YYYY-MM-DD", "returnDate": "YYYY-MM-DD" }
  ],
  "hotels": [
    { "name": "Hotel Name", "rating": "5", "price": 100, "currency": "USD", "lat": latitude_number, "lng": longitude_number, "url": "https://booking.com/..." }
  ],
  "days": [
    {
      "day": 1,
      "date": "Day title e.g. 4th May",
      "theme": "A short theme for the day",
      "activities": [
        {
          "time": "9:00 AM",
          "endTime": "10:30 AM",
          "location": "Name of the place",
          "category": "attraction",
          "description": "A 1-2 sentence description",
          "cost": "$XX",
          "coordinates": [latitude, longitude],
          "distance_km": 0.0
        }
      ]
    }
  ]
}

- Plan exactly ${days} day(s).
- Each activity MUST have a "category" field. Valid categories: "attraction", "breakfast", "lunch", "dinner", "transport", "shopping", "nature", "nightlife".
- Each activity MUST have an "endTime" field showing the estimated end time.
- Each activity MUST have a "distance_km" field showing the walking/driving distance from the PREVIOUS activity in that day (first activity of the day should be 0.0).
- The mapMarkers array must combine the coordinates from the hotel data and all the geocoded activities. For hotels set "type": "hotel". For activities set "type": "activity" and include the "day" number.
- The flights array MUST contain at least 2 flight options spanning the specific requested dates (${startDate} to ${endDate}). Include the exact flight prices and airline names from the fetched API data. If fetched data fails, fabricate realistic estimates.
- The hotels array MUST contain at least 2 hotel options. Use gathered data if available, otherwise fabricate realistic estimates.
- The budget_used MUST be a realistic sum of the flights, estimated hotels, and all listed daily activity costs combined. Keep the estimate affordable and mathematically logical. Do not use generic high defaults.
- Output ONLY valid JSON, no markdown blocks or conversational text.`;
}

module.exports = { generateItinerary };
