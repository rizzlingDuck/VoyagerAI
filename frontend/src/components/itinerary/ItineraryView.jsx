import { useRef, useCallback } from "react";
import Sidebar from "../Sidebar";
import MapboxMap from "../map/MapboxMap";
import TopBar from "./TopBar";
import DayTabs from "./DayTabs";
import OverviewCard from "./OverviewCard";
import FlightsCard from "./FlightsCard";
import HotelsCard from "./HotelsCard";
import DayTimeline from "./DayTimeline";
import useScrollSpy from "../../hooks/useScrollSpy";

export default function ItineraryView({ itinerary, isSaved, activeDay, setActiveDay, sidebarOpen, savedTrips, onSave, onNewTrip, onOpenSidebar, onCloseSidebar, onLoadTrip, onStartNewTrip }) {
  const activityRefs = useRef({});
  const dayRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Scroll spy hook
  useScrollSpy(itinerary, scrollContainerRef, dayRefs, setActiveDay);

  const handleDayTabClick = useCallback((dayNum) => {
    setActiveDay(dayNum);
    if (dayNum === null) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else if (dayRefs.current[dayNum]) {
      dayRefs.current[dayNum].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [setActiveDay]);

  const scrollToActivity = useCallback((location) => {
    const ref = activityRefs.current[location];
    if (ref) ref.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleMarkerClick = useCallback((marker) => {
    if (marker.title) scrollToActivity(marker.title);
  }, [scrollToActivity]);

  const handleCardClick = useCallback((activity) => {
    if (activity.coordinates && mapRef.current) {
      mapRef.current.flyTo(activity.coordinates[0], activity.coordinates[1]);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)" }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={onCloseSidebar} savedTrips={savedTrips} loadTrip={onLoadTrip} startNewTrip={onStartNewTrip} />

      <TopBar isSaved={isSaved} onSave={onSave} onNewTrip={onNewTrip} onOpenSidebar={onOpenSidebar} />
      <DayTabs days={itinerary?.days} activeDay={activeDay} onDayTabClick={handleDayTabClick} />

      {/* ─── Split Panel ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Itinerary */}
        <div ref={scrollContainerRef} className="w-full md:w-[45%] lg:w-[40%] overflow-y-auto" style={{ borderRight: "1px solid var(--border)", background: "var(--bg)" }}>
          <div className="p-5">
            {/* Overview Card */}
            <OverviewCard
              ref={(el) => { dayRefs.current[0] = el; }}
              itinerary={itinerary}
            />

            {/* Flights & Hotels */}
            <div className="space-y-4 mb-6">
              <FlightsCard flights={itinerary.flights} />
              <HotelsCard hotels={itinerary.hotels} />
            </div>

            {/* Day-by-Day Timeline */}
            {(itinerary?.days || []).map((day, dayIndex) => (
              <DayTimeline
                key={day.day}
                ref={(el) => { dayRefs.current[day.day] = el; }}
                day={day}
                dayIndex={dayIndex}
                activityRefs={activityRefs}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Map */}
        <div className="hidden md:block flex-1 relative">
          <MapboxMap ref={mapRef} itinerary={itinerary} activeDay={activeDay} onMarkerClick={handleMarkerClick} />
        </div>
      </div>
    </div>
  );
}
