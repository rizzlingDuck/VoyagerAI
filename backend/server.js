const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { generateItinerary } = require("./ai/mainAgent");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── Original endpoint (kept for backward compatibility) ───
app.post("/api/plan-trip", async (req, res) => {
  try {
    const { destination, origin, days, interests, budget: budgetLevel, pace, guests, startDate, endDate } = req.body;
    const itinerary = await generateItinerary(destination, origin, days, { interests, budgetLevel, pace, guests, startDate, endDate });
    res.json(itinerary);
  } catch (error) {
    console.error("Trip planning error:", error);
    res.status(500).json({ error: "Failed to generate itinerary. Please try again." });
  }
});

// ─── SSE Streaming endpoint ───
app.post("/api/plan-trip-stream", async (req, res) => {
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
