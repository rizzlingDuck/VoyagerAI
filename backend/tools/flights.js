const { ToolError, fetchJson } = require("../utils/http");

async function findFlights({ originCode, destCode, departureDate, returnDate, signal }) {
  if (!process.env.RAPIDAPI_KEY) {
    throw new ToolError("RAPIDAPI_KEY is required for flight search", {
      tool: "findFlights",
      retryable: false,
    });
  }

  const params = new URLSearchParams({
    departure_id: originCode,
    arrival_id: destCode,
    outbound_date: departureDate,
    currency: "USD",
    adults: "1",
  });

  if (returnDate) params.set("return_date", returnDate);

  const jsonData = await fetchJson(
    `https://google-flights2.p.rapidapi.com/api/v1/searchFlights?${params.toString()}`,
    {
      tool: "findFlights",
      timeoutMs: 15000,
      signal,
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "google-flights2.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    }
  );

  const topFlights = jsonData?.data?.itineraries?.topFlights || [];
  const flights = topFlights.slice(0, 3).map((flight) => ({
    airline: flight.flights?.[0]?.airline || "Unknown Airline",
    price: flight.price || null,
    currency: "USD",
    departureDate,
    returnDate: returnDate || "",
  }));

  return {
    flights,
    tripType: returnDate ? "round-trip" : "one-way",
    originCode,
    destCode,
  };
}

module.exports = { findFlights };
