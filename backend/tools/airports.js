const { ToolError } = require("../utils/http");

const AIRPORT_ALIASES = new Map(
  Object.entries({
    amsterdam: "AMS",
    ahmedabad: "AMD",
    athens: "ATH",
    atlanta: "ATL",
    auckland: "AKL",
    bangalore: "BLR",
    bengaluru: "BLR",
    bangkok: "BKK",
    barcelona: "BCN",
    beijing: "PEK",
    berlin: "BER",
    boston: "BOS",
    brussels: "BRU",
    budapest: "BUD",
    buenosaires: "EZE",
    cairo: "CAI",
    capetown: "CPT",
    chicago: "ORD",
    chennai: "MAA",
    copenhagen: "CPH",
    delhi: "DEL",
    denver: "DEN",
    doha: "DOH",
    dubai: "DXB",
    dublin: "DUB",
    edinburgh: "EDI",
    frankfurt: "FRA",
    goa: "GOI",
    hongkong: "HKG",
    honolulu: "HNL",
    hyderabad: "HYD",
    istanbul: "IST",
    jakarta: "CGK",
    johannesburg: "JNB",
    jaipur: "JAI",
    kochi: "COK",
    kolkata: "CCU",
    kualalumpur: "KUL",
    lasvegas: "LAS",
    lisbon: "LIS",
    london: "LHR",
    losangeles: "LAX",
    madrid: "MAD",
    manila: "MNL",
    melbourne: "MEL",
    mexico: "MEX",
    mexicocity: "MEX",
    miami: "MIA",
    milan: "MXP",
    montreal: "YUL",
    mumbai: "BOM",
    munich: "MUC",
    newdelhi: "DEL",
    newyork: "JFK",
    nyc: "JFK",
    orlando: "MCO",
    osaka: "KIX",
    oslo: "OSL",
    paris: "CDG",
    phuket: "HKT",
    pune: "PNQ",
    prague: "PRG",
    rome: "FCO",
    sanfrancisco: "SFO",
    seattle: "SEA",
    seoul: "ICN",
    shanghai: "PVG",
    singapore: "SIN",
    sydney: "SYD",
    taipei: "TPE",
    tokyo: "HND",
    toronto: "YYZ",
    vancouver: "YVR",
    venice: "VCE",
    vienna: "VIE",
    warsaw: "WAW",
    washingtondc: "IAD",
    zurich: "ZRH",
  })
);

function normalizeLocation(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function resolveAirportCode(locationName) {
  const raw = String(locationName || "").trim();
  const upper = raw.toUpperCase();
  const explicitCode =
    upper.match(/^([A-Z]{3})$/) ||
    raw.match(/\(([A-Z]{3})\)/) ||
    raw.match(/\b([A-Z]{3})$/);

  if (explicitCode) return explicitCode[1];

  const candidates = [
    raw,
    raw.split(",")[0],
    raw.replace(/\b(international|airport|city)\b/gi, ""),
  ].map(normalizeLocation);

  for (const candidate of candidates) {
    if (AIRPORT_ALIASES.has(candidate)) {
      return AIRPORT_ALIASES.get(candidate);
    }
  }

  throw new ToolError(
    `No IATA airport code found for "${raw}". Enter an airport code like "JFK" or a supported city name.`,
    {
      tool: "resolveAirportCode",
      retryable: false,
    }
  );
}

module.exports = { resolveAirportCode, AIRPORT_ALIASES };
