import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "voyager_trips";

/**
 * Custom hook encapsulating saved-trip persistence (currently localStorage).
 * Can be swapped for a database-backed implementation later.
 */
export default function useSavedTrips() {
  const [savedTrips, setSavedTrips] = useState([]);

  // Load from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSavedTrips(JSON.parse(stored)); } catch (e) { /* corrupt data, ignore */ }
    }
  }, []);

  const saveTrip = useCallback((itinerary) => {
    const tripToSave = { ...itinerary, id: Date.now(), savedAt: new Date().toISOString() };
    const updated = [tripToSave, ...savedTrips];
    setSavedTrips(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return tripToSave;
  }, [savedTrips]);

  const findTrip = useCallback((id) => {
    return savedTrips.find((t) => t.id === id) || null;
  }, [savedTrips]);

  return { savedTrips, saveTrip, findTrip };
}
