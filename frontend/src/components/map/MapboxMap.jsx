import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MapboxMap = forwardRef(function MapboxMap({ itinerary, activeDay, onMarkerClick }, ref) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  useImperativeHandle(ref, () => ({
    flyTo(lat, lng) {
      if (map.current) {
        map.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
      }
    }
  }));

  useEffect(() => {
    if (!mapContainer.current || !itinerary?.centerCoordinates) return;

    if (map.current) { map.current.remove(); map.current = null; }
    markersRef.current = [];

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [itinerary.centerCoordinates[1], itinerary.centerCoordinates[0]],
      zoom: 12,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    const allMarkers = [];
    if (itinerary.hotels) {
      itinerary.hotels.forEach(h => {
        if (h.lat && h.lng) allMarkers.push({ ...h, title: h.name, type: "hotel" });
      });
    }
    if (itinerary.days) {
      itinerary.days.forEach(d => {
        if (d.activities) {
          d.activities.forEach(act => {
            if (act.coordinates && act.coordinates.length === 2 && act.coordinates[0] !== 0) {
              allMarkers.push({ ...act, title: act.location, lat: act.coordinates[0], lng: act.coordinates[1], type: "activity", day: d.day });
            }
          });
        }
      });
    }

    allMarkers.forEach((marker, idx) => {
      if (!marker.lat || !marker.lng) return;
      if (activeDay !== null && marker.type === "activity" && marker.day !== activeDay) return;

      const isHotel = marker.type === "hotel";
      const color = isHotel ? "#0EA5E9" : "#F97316";

      const el = document.createElement("div");
      el.className = "mapbox-marker-container";
      
      const inner = document.createElement("div");
      inner.style.cssText = `
        width: 34px; height: 34px; border-radius: 50%; 
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 12px rgba(0,0,0,0.2), 0 0 0 2px ${color}33;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 12px; font-weight: 700;
        cursor: pointer; transition: transform 0.2s ease;
      `;
      inner.textContent = isHotel ? "H" : (idx + 1);
      inner.addEventListener("mouseenter", () => { inner.style.transform = "scale(1.15)"; });
      inner.addEventListener("mouseleave", () => { inner.style.transform = "scale(1)"; });
      el.appendChild(inner);

      const popup = new mapboxgl.Popup({ offset: 25, maxWidth: "260px" }).setHTML(`
        <div style="font-family: 'Work Sans', sans-serif;">
          <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #0C4A6E;">${marker.title}</h3>
          <span style="font-size: 11px; color: ${color}; font-weight: 600; text-transform: uppercase;">${isHotel ? "Hotel" : `Day ${marker.day || "?"} Activity`}</span>
        </div>
      `);

      const mapMarker = new mapboxgl.Marker(el).setLngLat([marker.lng, marker.lat]).setPopup(popup).addTo(mapInstance);
      inner.addEventListener("click", () => { if (onMarkerClick) onMarkerClick(marker); });
      markersRef.current.push({ marker: mapMarker, data: marker });
    });

    map.current = mapInstance;
    return () => { if (map.current) { map.current.remove(); map.current = null; } };
  }, [itinerary, activeDay]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
});

export default MapboxMap;
