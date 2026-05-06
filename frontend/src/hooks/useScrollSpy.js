import { useEffect, useRef } from "react";

/**
 * Custom hook that tracks which day section is currently visible in the scroll container.
 * Temporarily pauses during programmatic scrolls (tab clicks) to prevent fighting.
 */
export default function useScrollSpy(itinerary, scrollContainerRef, dayRefs, setActiveDay) {
  const isManualScroll = useRef(false);
  const manualTimeout = useRef(null);

  // Expose a way for the parent to signal a programmatic scroll
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    // Tag the container so handleDayTabClick can access it
    scrollContainerRef.current.__pauseScrollSpy = () => {
      isManualScroll.current = true;
      if (manualTimeout.current) clearTimeout(manualTimeout.current);
      manualTimeout.current = setTimeout(() => { isManualScroll.current = false; }, 1000);
    };
  }, [scrollContainerRef]);

  useEffect(() => {
    if (!itinerary || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;

    const handleScroll = () => {
      if (isManualScroll.current) return;
      const containerTop = container.getBoundingClientRect().top;
      let currentDay = null;

      const sortedEntries = Object.entries(dayRefs.current).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
      sortedEntries.forEach(([dayNum, el]) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top - containerTop < 200) {
            const num = parseInt(dayNum);
            currentDay = num === 0 ? null : num;
          }
        }
      });
      setActiveDay(currentDay);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [itinerary, scrollContainerRef, dayRefs, setActiveDay]);
}
