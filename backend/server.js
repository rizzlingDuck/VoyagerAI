const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { generateItinerary } = require("./ai/mainAgent");
const { authMiddleware } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// 10 trip-planning requests per IP per 15 minutes — prevents API key abuse.
const tripLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP. Please wait 15 minutes before planning another trip.",
  },
});

// ─── Input Validation ─────────────────────────────────────────────────────────
function validateTripInput(body) {
  const { destination, origin, startDate, endDate, days } = body;

  if (!destination || destination.trim().length < 2)
    return "Please enter a valid destination (at least 2 characters).";

  if (!origin || origin.trim().length < 2)
    return "Please enter a valid departure city (at least 2 characters).";

  if (!startDate || !endDate)
    return "Travel dates are required.";

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()))
    return "Invalid travel dates. Please select valid start and end dates.";

  if (end < start)
    return "End date must be after start date.";

  const numDays = Number(days);
  if (!numDays || numDays < 1 || numDays > 30)
    return "Trip duration must be between 1 and 30 days.";

  return null; // no error
}

// ─── Original endpoint (kept for backward compatibility) ──────────────────────
app.post("/api/plan-trip", tripLimiter, authMiddleware, async (req, res) => {
  const validationError = validateTripInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const { destination, origin, days, interests, budget: budgetLevel, pace, guests, startDate, endDate } = req.body;
    const itinerary = await generateItinerary(destination, origin, days, { interests, budgetLevel, pace, guests, startDate, endDate });
    res.json(itinerary);
  } catch (error) {
    console.error("Trip planning error:", error);
    res.status(500).json({ error: "Failed to generate itinerary. Please try again." });
  }
});

// ─── SSE Streaming endpoint ───────────────────────────────────────────────────
app.post("/api/plan-trip-stream", tripLimiter, authMiddleware, async (req, res) => {
  const validationError = validateTripInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering if proxied
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { destination, origin, days, interests, budget: budgetLevel, pace, guests, startDate, endDate } = req.body;

    sendEvent("status", { phase: "started", message: "Planning your adventure..." });

    const itinerary = await generateItinerary(
      destination, origin, days,
      { interests, budgetLevel, pace, guests, startDate, endDate },
      sendEvent // pass the streaming callback
    );

    sendEvent("complete", itinerary);
  } catch (error) {
    console.error("Streaming trip planning error:", error);
    sendEvent("error", { message: "Failed to generate itinerary. Please try again." });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 VoyagerAI backend running on http://localhost:${PORT}`);
});
