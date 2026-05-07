import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook — saved trip persistence via Supabase (PostgreSQL + RLS).
 * Falls back to empty state if the user is not logged in.
 */
export default function useSavedTrips() {
  const { user } = useAuth();
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load trips from Supabase whenever the user changes
  useEffect(() => {
    if (!user) { setSavedTrips([]); return; }

    setLoading(true);
    supabase
      .from("trips")
      .select("id, destination, saved_at, itinerary")
      .order("saved_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("[useSavedTrips] Failed to load trips:", error.message);
        } else {
          // Flatten: expose itinerary fields at top level for compatibility
          setSavedTrips(
            (data || []).map((row) => ({
              ...row.itinerary,
              id: row.id,
              savedAt: row.saved_at,
              destination: row.destination,
            }))
          );
        }
        setLoading(false);
      });
  }, [user]);

  const saveTrip = useCallback(async (itinerary) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        destination: itinerary.destination,
        itinerary,
      })
      .select("id, destination, saved_at, itinerary")
      .single();

    if (error) {
      console.error("[useSavedTrips] Failed to save trip:", error.message);
      return null;
    }

    const saved = { ...data.itinerary, id: data.id, savedAt: data.saved_at, destination: data.destination };
    setSavedTrips((prev) => [saved, ...prev]);
    return saved;
  }, [user]);

  const findTrip = useCallback((id) => {
    return savedTrips.find((t) => t.id === id) || null;
  }, [savedTrips]);

  const deleteTrip = useCallback(async (id) => {
    if (!user) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (!error) setSavedTrips((prev) => prev.filter((t) => t.id !== id));
  }, [user]);

  return { savedTrips, loading, saveTrip, findTrip, deleteTrip };
}
