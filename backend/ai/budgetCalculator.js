/**
 * Deterministic budget calculator.
 * Computes budget_used server-side from the structured itinerary JSON
 * instead of trusting the LLM to do arithmetic.
 *
 * Formula:
 *   budget = cheapest_flight + (cheapest_hotel_per_night × nights) + Σ(activity costs)
 *
 * Returns both a formatted string and a breakdown object for transparency.
 */

function calculateBudget(itinerary) {
  const breakdown = {
    flight: 0,
    hotelPerNight: 0,
    hotelNights: 0,
    hotelTotal: 0,
    activities: 0,
    total: 0,
  };

  // ── Cheapest flight (assume round-trip from API) ──────────────────────────
  const flightPrices = (itinerary.flights || [])
    .map(f => parseFloat(f.price) || 0)
    .filter(p => p > 0)
    .sort((a, b) => a - b);

  if (flightPrices.length > 0) {
    breakdown.flight = flightPrices[0];
  }

  // ── Cheapest hotel × nights ───────────────────────────────────────────────
  const hotelPrices = (itinerary.hotels || [])
    .map(h => {
      // Prefer explicit pricePerNight, fall back to price
      const perNight = parseFloat(h.pricePerNight) || parseFloat(h.price) || 0;
      return perNight;
    })
    .filter(p => p > 0)
    .sort((a, b) => a - b);

  const nights = Math.max((itinerary.days?.length || 1) - 1, 1);
  if (hotelPrices.length > 0) {
    breakdown.hotelPerNight = hotelPrices[0];
    breakdown.hotelNights = nights;
    breakdown.hotelTotal = breakdown.hotelPerNight * nights;
  }

  // ── Sum all activity costs ────────────────────────────────────────────────
  for (const day of (itinerary.days || [])) {
    for (const act of (day.activities || [])) {
      const costStr = String(act.cost || '');
      // Parse "$15", "~$20", "Free", "$0", "15 USD" etc.
      const numMatch = costStr.match(/[\d,.]+/);
      if (numMatch) {
        const cost = parseFloat(numMatch[0].replace(/,/g, '')) || 0;
        breakdown.activities += cost;
      }
    }
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  breakdown.total = Math.round(breakdown.flight + breakdown.hotelTotal + breakdown.activities);

  const formatted = breakdown.total > 0
    ? `$${breakdown.total.toLocaleString('en-US')} estimated`
    : 'Could not estimate';

  console.log('[Budget Calculator] Breakdown:', breakdown);

  return { formatted, breakdown };
}

module.exports = { calculateBudget };
