const { fetchJson } = require("../utils/http");

async function getCoordinates({ locationName, signal }) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
  const data = await fetchJson(url, {
    tool: "getCoordinates",
    timeoutMs: 10000,
    signal,
    headers: {
      "User-Agent": "VoyagerAI_Portfolio_Project/1.0",
    },
  });

  if (Array.isArray(data) && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }

  return null;
}

module.exports = { getCoordinates };
