const test = require("node:test");
const assert = require("node:assert/strict");

const { validateTripInput } = require("../validation/tripInput");

test("validateTripInput accepts a matching inclusive date range up to 30 days", () => {
  assert.equal(
    validateTripInput({
      destination: "Tokyo",
      origin: "Mumbai",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      days: 30,
    }),
    null
  );
});

test("validateTripInput rejects mismatched day counts", () => {
  assert.match(
    validateTripInput({
      destination: "Tokyo",
      origin: "Mumbai",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      days: 3,
    }),
    /does not match/
  );
});

test("validateTripInput rejects ranges over 30 days", () => {
  assert.match(
    validateTripInput({
      destination: "Tokyo",
      origin: "Mumbai",
      startDate: "2026-06-01",
      endDate: "2026-07-01",
      days: 31,
    }),
    /between 1 and 30/
  );
});
