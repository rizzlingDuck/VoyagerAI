const { tool } = require('@langchain/core/tools');
const { z } = require('zod');

const { getCoordinates } = require('../tools/geocode');
const { findFlights } = require('../tools/flights');
const { searchWeb } = require('../tools/search');

const geocodeTool = tool(
  async ({ locationName }) => {
    const coords = await getCoordinates(locationName);
    if (!coords) return 'Could not find coordinates for the given location.';
    return JSON.stringify(coords);
  },
  {
    name: 'get_coordinates',
    description:
      'Geocodes a location name into latitude and longitude coordinates using OpenStreetMap. Use this tool when you need to find the geographic coordinates of a city, landmark, address, or any named place. Returns coordinates in [lat, lon] format for map display.',
    schema: z.object({
      locationName: z
        .string()
        .describe('The name of the location to geocode, e.g. "Tokyo Tower", "Paris, France", "JFK Airport"'),
    }),
  }
);

const flightTool = tool(
  async ({ originCode, destCode, dateOfDeparture }) => {
    const flights = await findFlights(originCode, destCode, dateOfDeparture);
    if (!flights || flights.length === 0) return 'No flights found for the given route and date.';
    return JSON.stringify(flights);
  },
  {
    name: 'find_flights',
    description:
      'Searches for flights between two airports on a specific date. Use this tool when the user wants to find flights, airfare, or travel options between two cities or airports. Returns the top 3 flight options with airline name, price, and currency.',
    schema: z.object({
      originCode: z
        .string()
        .describe('The IATA airport code for the departure city, e.g. "JFK", "LAX", "DEL"'),
      destCode: z
        .string()
        .describe('The IATA airport code for the destination city, e.g. "LHR", "NRT", "CDG"'),
      dateOfDeparture: z
        .string()
        .describe('The departure date in YYYY-MM-DD format, e.g. "2026-10-15"'),
    }),
  }
);

const searchTool = tool(
  async ({ query }) => {
    const results = await searchWeb(query);
    if (!results || results.length === 0) return 'No search results found.';
    return JSON.stringify(results);
  },
  {
    name: 'search_web',
    description:
      'Searches the web for real-time information using Tavily. Use this tool when you need current, up-to-date information such as weather, news, events, prices, or any factual data that may change over time. Returns the top 3 results with titles and content.',
    schema: z.object({
      query: z
        .string()
        .describe('The search query to look up on the web, e.g. "Current weather in Tokyo", "Best restaurants in Paris"'),
    }),
  }
);

module.exports = { tools: [geocodeTool, flightTool, searchTool] };
