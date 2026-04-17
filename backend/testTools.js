require('dotenv').config();

const { getCoordinates } = require('./tools/geocode');
const { findFlights } = require('./tools/flights');
const { searchWeb } = require('./tools/search');

(async () => {
  console.log("--- Geocode Test ---");
  console.log(await getCoordinates('Tokyo Tower'));

  console.log("--- Flights Test ---");
  console.log(await findFlights('JFK', 'LHR', '2026-10-15'));

  console.log("--- Search Test ---");
  console.log(await searchWeb('Current weather in Tokyo'));
})();
