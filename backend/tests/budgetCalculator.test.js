const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateBudget } = require("../ai/budgetCalculator");

test("calculateBudget uses cheapest round-trip flight, cheapest hotel, and activity costs", () => {
  const { formatted, breakdown } = calculateBudget({
    flights: [
      { airline: "A", price: 600 },
      { airline: "B", price: 450 },
    ],
    hotels: [
      { name: "A", pricePerNight: 160 },
      { name: "B", pricePerNight: 110 },
    ],
    days: [
      {
        activities: [
          { cost: "$20" },
          { cost: "Free" },
        ],
      },
      {
        activities: [
          { cost: "~$35" },
          { cost: "15 USD" },
        ],
      },
      {
        activities: [
          { cost: "$0" },
        ],
      },
    ],
  });

  assert.equal(breakdown.flight, 450);
  assert.equal(breakdown.hotelPerNight, 110);
  assert.equal(breakdown.hotelNights, 2);
  assert.equal(breakdown.activities, 70);
  assert.equal(breakdown.total, 740);
  assert.equal(formatted, "$740 estimated");
});
