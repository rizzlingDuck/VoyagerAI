import { useState } from "react";
import mapboxgl from "mapbox-gl";
import { differenceInDays, format } from "date-fns";

import LandingPage from "./components/landing/LandingPage";
import StreamingLoader from "./components/common/StreamingLoader";
import ItineraryView from "./components/itinerary/ItineraryView";
import ErrorBoundary from "./components/common/ErrorBoundary";
import useSavedTrips from "./hooks/useSavedTrips";
import useStreamingTrip from "./hooks/useStreamingTrip";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// ─────────────── Main App ───────────────
function App() {
  const [formData, setFormData] = useState({ destination: "", origin: "", interests: "", budget: "", pace: "", guests: "" });
  const [dateRange, setDateRange] = useState([null, null]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [error, setError] = useState(null);

  const { savedTrips, saveTrip, findTrip } = useSavedTrips();
  const { status, phase, phaseMessage, toolEvents, itinerary, error: streamError, startTrip } = useStreamingTrip();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateRange[0] || !dateRange[1]) {
      setError("Please select travel dates.");
      return;
    }
    
    setIsSaved(false);
    setActiveDay(null);
    setError(null);

    const computedDays = differenceInDays(dateRange[1], dateRange[0]) + 1;
    startTrip({
      ...formData,
      days: computedDays,
      startDate: format(dateRange[0], "yyyy-MM-dd"),
      endDate: format(dateRange[1], "yyyy-MM-dd"),
    });
  };

  const handleSave = () => {
    if (!itinerary || isSaved) return;
    saveTrip(itinerary);
    setIsSaved(true);
  };

  const handleLoadTrip = (id) => {
    const trip = findTrip(id);
    // Loading a saved trip goes directly into the itinerary view
    // We need to handle this differently since streaming hook owns itinerary state
    // For now, loaded trips bypass streaming
    if (trip) {
      setIsSaved(true);
      setActiveDay(null);
      // Use a separate state for loaded trips
      setLoadedTrip(trip);
    }
  };

  // Separate state for trips loaded from history (bypasses streaming)
  const [loadedTrip, setLoadedTrip] = useState(null);
  const displayedItinerary = loadedTrip || itinerary;

  const handleNewTrip = () => {
    setLoadedTrip(null);
    setIsSaved(false);
    setActiveDay(null);
    setFormData({ destination: "", origin: "", interests: "", budget: "", pace: "", guests: "" });
    setDateRange([null, null]);
  };

  // ─── Landing Page ───
  if (!displayedItinerary && status !== "streaming") {
    return (
      <LandingPage
        formData={formData}
        dateRange={dateRange}
        error={error || streamError}
        sidebarOpen={sidebarOpen}
        savedTrips={savedTrips}
        onFormChange={handleChange}
        onDateChange={(update) => setDateRange(update)}
        onSubmit={handleSubmit}
        onOpenSidebar={() => setSidebarOpen(true)}
        onCloseSidebar={() => setSidebarOpen(false)}
        onLoadTrip={handleLoadTrip}
        onStartNewTrip={handleNewTrip}
      />
    );
  }

  // ─── Streaming Loading ───
  if (status === "streaming") {
    return (
      <StreamingLoader
        phase={phase}
        phaseMessage={phaseMessage}
        toolEvents={toolEvents}
      />
    );
  }

  // ─── Itinerary View ───
  return (
    <ErrorBoundary onReset={handleNewTrip}>
      <ItineraryView
        itinerary={displayedItinerary}
        isSaved={isSaved}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
        sidebarOpen={sidebarOpen}
        savedTrips={savedTrips}
        onSave={handleSave}
        onNewTrip={handleNewTrip}
        onOpenSidebar={() => setSidebarOpen(true)}
        onCloseSidebar={() => setSidebarOpen(false)}
        onLoadTrip={handleLoadTrip}
        onStartNewTrip={handleNewTrip}
      />
    </ErrorBoundary>
  );
}

export default App;
