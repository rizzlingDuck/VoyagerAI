// This file acts as an export hub to maintain backward compatibility with server.js
// after migrating to the CPaaT Multi-Agent Architecture.

const { generateItinerary } = require("./mainAgent");

module.exports = { generateItinerary };
