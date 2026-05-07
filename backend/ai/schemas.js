const { z } = require("zod");

// ─── Control Plane: Tool Request Array ───────────────────────────────────────
// Validates the 8B model's JSON output before we attempt parallel execution.

const ToolRequestSchema = z.array(
  z.object({
    toolName: z.enum(["findFlights", "getCoordinates", "searchWeb", "searchHotels"]),
    params: z.record(z.string()),
  })
);

// ─── Itinerary: Full Output Schema ───────────────────────────────────────────
// Validates the Boss Agent's final synthesis JSON.

const MapMarkerSchema = z.object({
  title: z.string(),
  lat: z.number(),
  lng: z.number(),
  type: z.enum(["hotel", "activity"]),
  day: z.number().optional(),
});

const FlightSchema = z.object({
  airline: z.string(),
  price: z.union([z.number(), z.string()]),
  currency: z.string(),
  departureDate: z.string(),
  returnDate: z.string(),
});

const HotelSchema = z.object({
  name: z.string(),
  rating: z.union([z.number(), z.string()]),
  price: z.union([z.number(), z.string()]),
  currency: z.string(),
  lat: z.number(),
  lng: z.number(),
  url: z.string().optional(),
});

const ActivitySchema = z.object({
  time: z.string(),
  endTime: z.string().optional(),
  location: z.string(),
  category: z.enum([
    "attraction", "breakfast", "lunch", "dinner",
    "transport", "shopping", "nature", "nightlife",
  ]),
  description: z.string(),
  cost: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]),
  distance_km: z.number().optional(),
});

const DaySchema = z.object({
  day: z.number(),
  date: z.string().optional(),
  theme: z.string().optional(),
  activities: z.array(ActivitySchema).min(1),
});

const ItinerarySchema = z.object({
  destination: z.string(),
  overview: z.string().optional(),
  centerCoordinates: z.tuple([z.number(), z.number()]),
  budget_used: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  mapMarkers: z.array(MapMarkerSchema).optional().default([]),
  flights: z.array(FlightSchema).min(1),
  hotels: z.array(HotelSchema).min(1),
  days: z.array(DaySchema).min(1),
});

module.exports = { ToolRequestSchema, ItinerarySchema };
