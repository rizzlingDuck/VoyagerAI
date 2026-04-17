const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { generateItinerary } = require("./ai/agent");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`🚀 VoyagerAI backend running on http://localhost:${PORT}`);
});
