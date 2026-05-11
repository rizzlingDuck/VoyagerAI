const { ChatGroq } = require("@langchain/groq");
const { gatherTripData } = require("./controlPlane");
const { ItinerarySchema } = require("./schemas");
const { calculateBudget } = require("./budgetCalculator");
const { withTimeout } = require("../utils/timeout");

const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 45000);

const bossLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  modelName: "llama-3.3-70b-versatile",
  temperature: 0,
});

async function generateItinerary(destination, origin, days, options = {}, onEvent, signal) {
  const { interests, budgetLevel, pace, guests, startDate, endDate } = options;

  console.log(
    `\n[Main Agent] Starting deterministic workflow for ${destination} from ${origin || "unspecified"} (${days} days)`
  );

  try {
    throwIfAborted(signal);

    onEvent?.("status", {
      phase: "reasoning",
      message: "Gathering live travel data...",
    });

    const rawToolData = await gatherTripData(
      { destination, origin, days, interests, budgetLevel, startDate, endDate, signal },
      onEvent
    );

    throwIfAborted(signal);

    onEvent?.("status", {
      phase: "synthesizing",
      message: "Crafting your personalized itinerary...",
    });

    const synthesizerPrompt = buildSynthesizerPrompt(
      rawToolData,
      destination,
      days,
      startDate,
      endDate,
      pace,
      guests,
      interests,
      budgetLevel
    );

    const synthesizerResult = await withTimeout(
      bossLLM.invoke([{ role: "user", content: synthesizerPrompt }]),
      LLM_TIMEOUT_MS,
      "Itinerary synthesis"
    );

    throwIfAborted(signal);

    const cleanFinalJson = extractContent(synthesizerResult)
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let finalItinerary = await parseAndValidateItinerary(
      cleanFinalJson,
      destination,
      days,
      startDate,
      endDate,
      pace,
      guests,
      interests
    );

    const { formatted, breakdown } = calculateBudget(finalItinerary);
    finalItinerary.budget_used = formatted;
    finalItinerary.budget_breakdown = breakdown;

    return finalItinerary;
  } catch (error) {
    console.error("[Main Agent] Workflow failed:", error);
    throw error;
  }
}

async function parseAndValidateItinerary(rawJson, destination, days, startDate, endDate, pace, guests, interests) {
  try {
    const parsed = JSON.parse(rawJson);
    const validated = ItinerarySchema.safeParse(parsed);

    if (validated.success) {
      return validated.data;
    }

    const errorSummary = validated.error.flatten();
    console.warn("[Main Agent] Itinerary failed schema validation:", JSON.stringify(errorSummary, null, 2));

    return await repairItinerary(rawJson, errorSummary, destination, days, startDate, endDate, pace, guests, interests);
  } catch (parseErr) {
    if (parseErr.name === "SyntaxError") {
      console.error("[Main Agent] Failed to parse itinerary JSON:", parseErr.message);
      return await repairItinerary(
        rawJson,
        { _parseError: parseErr.message },
        destination,
        days,
        startDate,
        endDate,
        pace,
        guests,
        interests
      );
    }

    throw parseErr;
  }
}

async function repairItinerary(brokenJson, errors, destination, days, startDate, endDate, pace, guests, interests) {
  const repairPrompt = `The following JSON itinerary has structural issues that must be fixed:

ERRORS:
${JSON.stringify(errors, null, 2)}

BROKEN JSON (first 3000 chars):
${brokenJson.slice(0, 3000)}

Trip context:
- Destination: ${destination}
- Days: ${days}
- Dates: ${startDate} to ${endDate}
${pace ? `- Pace: ${pace}` : ""}
${guests ? `- Guests: ${guests}` : ""}
${interests ? `- Interests: ${interests}` : ""}

Fix only the structural/schema issues listed above. Do not change the trip content.
Output only valid JSON that satisfies the schema. No markdown, no commentary.`;

  const repairResult = await withTimeout(
    bossLLM.invoke([{ role: "user", content: repairPrompt }]),
    LLM_TIMEOUT_MS,
    "Itinerary repair"
  );
  const cleanRepair = extractContent(repairResult)
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsedRepair = JSON.parse(cleanRepair);
  const revalidated = ItinerarySchema.safeParse(parsedRepair);

  if (!revalidated.success) {
    throw new Error("Itinerary repair failed schema validation");
  }

  return revalidated.data;
}

function extractContent(result) {
  if (typeof result.content === "string") return result.content;
  return result.content?.[0]?.text || "";
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new Error("Trip generation was cancelled");
  }
}

function buildSynthesizerPrompt(rawToolData, destination, days, startDate, endDate, pace, guests, interests, budgetLevel) {
  const budgetAnchors = {
    "$": {
      label: "Budget",
      meals: "$3-10 per meal",
      attractions: "mostly free or under $10",
      transport: "$1-5 local transport",
      hotelHint: "Use the cheapest hotel option from the data.",
    },
    "$$": {
      label: "Mid-range",
      meals: "$10-25 per meal",
      attractions: "$5-20 per attraction",
      transport: "$5-15 taxi/rideshare",
      hotelHint: "Use a moderately priced hotel from the data.",
    },
    "$$$": {
      label: "Luxury",
      meals: "$30-80 per meal",
      attractions: "$20-100 premium experiences",
      transport: "$20-50 private transport",
      hotelHint: "Use the highest-rated hotel from the data.",
    },
  };
  const anchors = budgetAnchors[budgetLevel] || budgetAnchors["$$"];

  return `Here is the real-world data fetched by the server-owned control plane:
${rawToolData}

IMPORTANT DATA NOTES:
- Any tool result with "_dataUnavailable": true means that data source failed or could not be resolved. For those sections, prefix prices with "~" (for example "~$50") and add "_estimated": true to the item.
- Flight prices from the API are round-trip totals, not one-way. Do not double them.
- Hotel prices include "pricePerNight" (per-night rate) and "priceTotal" (total stay). Use pricePerNight in the output.
- When estimating missing data, use conservative estimates appropriate for ${destination}, not US-centric defaults.

Using this data, create a detailed, day-by-day JSON itinerary for a trip to ${destination}. The flights and hotels arrays must not be empty. If real data is missing, create realistic estimates marked with "_estimated": true.

## Budget Calibration
Budget level: ${anchors.label} (${budgetLevel || "$$"})
Use these cost anchors for activities:
- Meals: ${anchors.meals}
- Attractions/activities: ${anchors.attractions}
- Local transport: ${anchors.transport}
- ${anchors.hotelHint}

IMPORTANT: Scale costs down for affordable destinations (SE Asia, India, Eastern Europe, Latin America). Scale up for expensive cities (Tokyo, London, Zurich, NYC). The costs must feel realistic for ${destination} specifically.

## Strict Constraints
${pace ? `- You must strictly adhere to the user's pace setting: ${pace}. If Relax, max 2-3 activities a day. If Active, pack the schedule.` : ""}
${guests ? `- Tailor the language and activity selection to the guest type: ${guests}.` : ""}
${interests ? `- Filter the gathered data to match the interests: ${interests}.` : ""}

Ensure the output strictly matches this JSON schema:
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
    { "name": "Hotel Name", "rating": "5", "pricePerNight": 100, "priceTotal": 500, "currency": "USD", "lat": latitude_number, "lng": longitude_number, "url": "https://booking.com/..." }
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
- Each activity must have a "category" field. Valid categories: "attraction", "breakfast", "lunch", "dinner", "transport", "shopping", "nature", "nightlife".
- Each activity must have an "endTime" field.
- Each activity must have a "distance_km" field showing the walking/driving distance from the previous activity in that day. The first activity of the day should be 0.0.
- Each activity must have a "cost" field. Use "Free" for no-cost activities, "$X" for paid ones.
- The mapMarkers array must combine hotel coordinates and all activity coordinates. For hotels set "type": "hotel". For activities set "type": "activity" and include the "day" number.
- The flights array must contain at least 2 flight options spanning the requested dates (${startDate} to ${endDate}).
- The hotels array must contain at least 2 hotel options with both pricePerNight and priceTotal.
- The budget_used field is a placeholder and will be overridden server-side.
- Output only valid JSON, no markdown blocks or conversational text.`;
}

module.exports = { generateItinerary, parseAndValidateItinerary, buildSynthesizerPrompt };
