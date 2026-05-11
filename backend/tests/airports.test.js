const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveAirportCode } = require("../tools/airports");

test("resolveAirportCode accepts explicit IATA codes", () => {
  assert.equal(resolveAirportCode("JFK"), "JFK");
  assert.equal(resolveAirportCode("New York (LGA)"), "LGA");
});

test("resolveAirportCode maps common city names deterministically", () => {
  assert.equal(resolveAirportCode("Tokyo, Japan"), "HND");
  assert.equal(resolveAirportCode("LOS ANGELES"), "LAX");
  assert.equal(resolveAirportCode("Mumbai"), "BOM");
  assert.equal(resolveAirportCode("San Francisco"), "SFO");
});

test("resolveAirportCode fails clearly for unsupported cities", () => {
  assert.throws(
    () => resolveAirportCode("Smallville"),
    /No IATA airport code found/
  );
});
