const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { validateEnv, buildCorsOptions, getAllowedOrigins } = require("./config/env");

validateEnv();

const { generateItinerary } = require("./ai/mainAgent");
const { authMiddleware } = require("./middleware/auth");
const { validateTripInput } = require("./validation/tripInput");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: "128kb" }));

const tripLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP. Please wait 15 minutes before planning another trip.",
  },
});

app.post("/api/plan-trip", tripLimiter, authMiddleware, async (req, res) => {
  const validationError = validateTripInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const controller = createResponseAbortController(res);

  try {
    const { destination, origin, days, interests, budget: budgetLevel, pace, guests, startDate, endDate } = req.body;
    const itinerary = await generateItinerary(
      destination,
      origin,
      days,
      { interests, budgetLevel, pace, guests, startDate, endDate },
      undefined,
      controller.signal
    );
    res.json(itinerary);
  } catch (error) {
    console.error("Trip planning error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate itinerary. Please try again." });
    }
  }
});

app.post("/api/plan-trip-stream", tripLimiter, authMiddleware, async (req, res) => {
  const validationError = validateTripInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const controller = createResponseAbortController(res);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sendEvent = (event, data) => {
    if (controller.signal.aborted || res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { destination, origin, days, interests, budget: budgetLevel, pace, guests, startDate, endDate } = req.body;

    sendEvent("status", { phase: "started", message: "Planning your adventure..." });

    const itinerary = await generateItinerary(
      destination,
      origin,
      days,
      { interests, budgetLevel, pace, guests, startDate, endDate },
      sendEvent,
      controller.signal
    );

    sendEvent("complete", itinerary);
  } catch (error) {
    console.error("Streaming trip planning error:", error);
    sendEvent("error", { message: "Failed to generate itinerary. Please try again." });
  } finally {
    if (!res.writableEnded) res.end();
  }
});

function createResponseAbortController(res) {
  const controller = new AbortController();

  res.on("close", () => {
    if (!res.writableEnded) {
      controller.abort(new Error("Client disconnected"));
    }
  });

  return controller;
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`VoyagerAI backend running on http://localhost:${PORT}`);
    console.log(`Allowed CORS origins: ${getAllowedOrigins().join(", ")}`);
  });
}

module.exports = { app, validateTripInput };
