const { getCoordinates } = require("../tools/geocode");
const { findFlights } = require("../tools/flights");
const { searchWeb } = require("../tools/search");
const { searchHotels } = require("../tools/hotels");
const { resolveAirportCode } = require("../tools/airports");
const { withRetry } = require("../utils/retry");

const toolRegistry = {
  getCoordinates,
  findFlights,
  searchWeb,
  searchHotels,
};

const TOOL_LABELS = {
  findFlights: "Searching flights",
  searchHotels: "Finding hotels",
  getCoordinates: "Mapping destination",
  searchWeb: "Researching destination",
};

async function gatherTripData(trip, onEvent) {
  const {
    destination,
    origin,
    budgetLevel,
    startDate,
    endDate,
    days,
    interests,
    signal,
  } = trip;

  onEvent?.("status", {
    phase: "planning",
    message: "Preparing live data sources...",
  });

  const requests = [
    {
      toolName: "getCoordinates",
      params: { locationName: destination },
    },
    {
      toolName: "searchHotels",
      params: {
        locationName: destination,
        budgetLevel,
        checkinDate: startDate,
        checkoutDate: endDate,
      },
    },
    {
      toolName: "searchWeb",
      params: {
        query: buildDestinationQuery(destination, days, interests),
      },
    },
  ];

  let flightResolution;
  try {
    flightResolution = {
      originCode: resolveAirportCode(origin),
      destCode: resolveAirportCode(destination),
    };
    requests.unshift({
      toolName: "findFlights",
      params: {
        originCode: flightResolution.originCode,
        destCode: flightResolution.destCode,
        departureDate: startDate,
        returnDate: endDate,
      },
    });
  } catch (err) {
    onEvent?.("tool_start", {
      tool: "findFlights",
      label: TOOL_LABELS.findFlights,
      params: { origin, destination, departureDate: startDate, returnDate: endDate },
    });
    onEvent?.("tool_error", {
      tool: "findFlights",
      label: TOOL_LABELS.findFlights,
      error: err.message,
    });
    requests.unshift({
      toolName: "findFlights",
      params: { origin, destination, departureDate: startDate, returnDate: endDate },
      skipped: true,
      error: err.message,
    });
  }

  onEvent?.("status", {
    phase: "fetching",
    message: `Fetching data from ${requests.length} sources...`,
  });

  const gatheredData = await Promise.all(
    requests.map((request) => runToolRequest(request, onEvent, signal))
  );

  return JSON.stringify(
    {
      input: {
        destination,
        origin,
        startDate,
        endDate,
        days,
        interests,
        airportCodes: flightResolution || null,
      },
      results: gatheredData,
    },
    null,
    2
  );
}

async function runToolRequest(request, onEvent, signal) {
  const { toolName, params } = request;
  const label = TOOL_LABELS[toolName] || toolName;

  if (request.skipped) {
    return {
      tool: toolName,
      params,
      error: request.error,
      _dataUnavailable: true,
    };
  }

  const toolFn = toolRegistry[toolName];
  if (!toolFn) {
    return { tool: toolName, params, error: "Unknown tool", _dataUnavailable: true };
  }

  onEvent?.("tool_start", { tool: toolName, label, params });

  try {
    const result = await withRetry(
      () => toolFn({ ...params, signal }),
      { maxAttempts: 3, baseDelayMs: 500, label: toolName }
    );

    onEvent?.("tool_complete", {
      tool: toolName,
      label,
      preview: buildToolPreview(toolName, result),
    });

    return { tool: toolName, params, result };
  } catch (err) {
    console.error(`[Control Plane] Tool ${toolName} failed:`, err.message);
    onEvent?.("tool_error", { tool: toolName, label, error: err.message });

    return {
      tool: toolName,
      params,
      error: err.message,
      _dataUnavailable: true,
    };
  }
}

function buildDestinationQuery(destination, days, interests) {
  const parts = [
    `${destination} best itinerary highlights`,
    days ? `${days} day trip` : "",
    interests ? `for travelers interested in ${interests}` : "",
    "neighborhoods attractions food practical travel tips",
  ].filter(Boolean);

  return parts.join(" ");
}

function buildToolPreview(toolName, result) {
  switch (toolName) {
    case "findFlights": {
      const flights = result?.flights || [];
      if (flights.length === 0) return { count: 0, summary: "No flights found" };
      return {
        count: flights.length,
        tripType: result.tripType || "unknown",
        originCode: result.originCode,
        destCode: result.destCode,
        items: flights.slice(0, 3).map((flight) => ({
          airline: flight.airline || "Unknown",
          price: flight.price || "N/A",
          currency: flight.currency || "USD",
        })),
      };
    }
    case "searchHotels": {
      if (!Array.isArray(result)) return { count: 0, summary: "No hotels found" };
      return {
        count: result.length,
        items: result.slice(0, 3).map((hotel) => ({
          name: hotel.name || "Unknown",
          rating: hotel.rating || "N/A",
          pricePerNight: hotel.pricePerNight || "N/A",
        })),
      };
    }
    case "getCoordinates": {
      if (!result) return { summary: "Location not found" };
      return { lat: result[0], lng: result[1], summary: "Found" };
    }
    case "searchWeb": {
      if (!Array.isArray(result)) return { count: 0, summary: "No results" };
      return { count: result.length, summary: `Found ${result.length} sources` };
    }
    default:
      return { summary: "Completed" };
  }
}

module.exports = { gatherTripData, buildDestinationQuery };
