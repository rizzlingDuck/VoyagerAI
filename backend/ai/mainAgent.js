const { ChatGroq } = require('@langchain/groq');
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { ask_control_plane } = require("./controlPlane");

// The Main Agent ('The Boss') uses the powerful versatile model for reasoning and synthesis
const bossLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  modelName: "llama-3.3-70b-versatile",
  temperature: 0
});

// Wrap the Control Plane function as a LangChain Tool so the Boss can invoke it
const controlPlaneTool = tool(
  async ({ query }) => {
    return await ask_control_plane({ query });
  },
  {
    name: "ask_control_plane",
    description: "Fetches all necessary real-world data (flights, hotels, map coordinates, web search). You MUST use this tool to gather information before creating the final itinerary.",
    schema: z.object({
      query: z.string().describe("A detailed instruction to the control plane about what data to fetch (e.g., 'Find flights from NYC to TYO, hotels in TYO, and exact coordinates for Tokyo Tower').")
    })
  }
);

// Bind the single tool to the Boss LLM
const bossWithTools = bossLLM.bindTools([controlPlaneTool]);

/**
 * Main orchestrator workflow replacing the old single-pass logic.
 */
async function generateItinerary(destination, origin, days, options = {}) {
  const { interests, budgetLevel, pace, guests, startDate, endDate } = options;
  const prefsText = [
    guests ? `Travelers: ${guests}` : '',
    budgetLevel ? `Budget level: ${budgetLevel}` : '',
    pace ? `Travel pace: ${pace}` : '',
    interests ? `Interests: ${interests}` : ''
  ].filter(Boolean).join('. ');
  
  console.log(`\n[Main Agent - Boss] Starting CPaaT Workflow for ${destination} from ${origin || 'unspecified'} (${days} days)`);
  
  try {
    // ==========================================
    // PHASE 1: BOSS REASONING & DATA DELEGATION
    // ==========================================
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
    const synthesizerPrompt = `Here is the real-world data fetched by your Control Plane:
${rawToolData}

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

    console.log('[Main Agent - Boss] Performing final synthesis based on gathered data...');
    const synthesizerResult = await bossLLM.invoke([{ role: 'user', content: synthesizerPrompt }]);

    const rawSynthResult = typeof synthesizerResult.content === 'string' ? synthesizerResult.content : synthesizerResult.content[0].text;
    const cleanFinalJson = rawSynthResult.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    console.log('[Main Agent - Boss] Parsing final itinerary...');
    const finalItinerary = JSON.parse(cleanFinalJson);
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
              coordinates: [0, 0]
            }
          ]
        }
      ]
    };
  }
}

module.exports = { generateItinerary };
