import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Clock, Banknote, Plane, Globe, Calendar, Bed, Menu, Bookmark, BookmarkCheck, Navigation, Users, Heart, Sparkles, ArrowRight, Star } from "lucide-react";
import Sidebar from "./components/Sidebar";
import DateRangeInput from "./components/DateRangeInput";
import { differenceInDays, format } from "date-fns";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// ─────────────── Category Config ───────────────
const CATEGORY_COLORS = {
  attraction: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD", label: "Attraction" },
  breakfast:  { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74", label: "Breakfast" },
  lunch:      { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", label: "Lunch" },
  dinner:     { bg: "#F3E8FF", text: "#6B21A8", border: "#C4B5FD", label: "Dinner" },
  transport:  { bg: "#E0F2FE", text: "#075985", border: "#7DD3FC", label: "Transport" },
  shopping:   { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4", label: "Shopping" },
  nature:     { bg: "#DCFCE7", text: "#166534", border: "#86EFAC", label: "Nature" },
  nightlife:  { bg: "#FDF4FF", text: "#86198F", border: "#E879F9", label: "Nightlife" },
};

// ─────────────── Animation Variants ───────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

// ─────────────── Mapbox Map Component ───────────────
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

// ─────────────── Typewriter ───────────────
function TypewriterHeading({ text1, text2 }) {
  const [rendered1, setRendered1] = useState("");
  const [rendered2, setRendered2] = useState("");
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setRendered1(text1.slice(0, index + 1));
      index++;
      if (index === text1.length) { clearInterval(interval); setPhase(2); }
    }, 55);
    return () => clearInterval(interval);
  }, [text1]);

  useEffect(() => {
    if (phase === 2) {
      let index = 0;
      const interval = setInterval(() => {
        setRendered2(text2.slice(0, index + 1));
        index++;
        if (index === text2.length) { clearInterval(interval); setPhase(3); }
      }, 55);
      return () => clearInterval(interval);
    }
  }, [phase, text2]);

  return (
    <>
      <span className="gradient-text">{rendered1}</span>
      {phase === 1 && <span className="inline-block w-[3px] h-[0.85em] bg-[var(--primary)] animate-pulse ml-0.5 align-bottom rounded-full" />}
      <br className="hidden md:block"/>
      {rendered2}
      {phase === 2 && <span className="inline-block w-[3px] h-[0.85em] bg-[var(--primary)] animate-pulse ml-0.5 align-bottom rounded-full" />}
    </>
  );
}

// ─────────────── Loading Spinner ───────────────
function LoadingSpinner() {
  const [statusIdx, setStatusIdx] = useState(0);
  const statuses = [
    "Searching flights & routes...",
    "Finding the best hotels...",
    "Curating local experiences...",
    "Building your perfect itinerary...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % statuses.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8" style={{ background: "var(--bg)" }}>
      {/* Spinner */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full blur-xl animate-glow-pulse" style={{ background: "rgba(14, 165, 233, 0.15)" }} />
        {/* Outer dashed ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-sky-300/40" style={{ animation: "spin-slow 10s linear infinite" }} />
        {/* Main arc */}
        <div className="absolute inset-[4px] rounded-full border-[3px] border-transparent border-t-sky-500 border-r-sky-400/30" style={{ animation: "spin-slow 1.5s linear infinite", boxShadow: "0 0 12px rgba(14, 165, 233, 0.3)" }} />
        {/* Reverse arc */}
        <div className="absolute inset-[12px] rounded-full border-[2px] border-transparent border-b-orange-400" style={{ animation: "spin-reverse 2.5s linear infinite", boxShadow: "0 0 8px rgba(249, 115, 22, 0.3)" }} />
        {/* Inner ring */}
        <div className="absolute inset-[20px] rounded-full border border-transparent border-l-sky-600/60" style={{ animation: "spin-slow 1s ease-in-out infinite" }} />
        {/* Center dot */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" style={{ boxShadow: "0 0 10px rgba(14, 165, 233, 0.6)" }} />
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={statusIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-medium"
            style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}
          >
            {statuses[statusIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          AI is gathering live data from multiple sources
        </p>
      </div>
    </div>
  );
}

// ─────────────── Main App ───────────────
function App() {
  const [formData, setFormData] = useState({ destination: "", origin: "", interests: "", budget: "", pace: "", guests: "" });
  const [dateRange, setDateRange] = useState([null, null]);
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedTrips, setSavedTrips] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [error, setError] = useState(null);
  const activityRefs = useRef({});
  const dayRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const mapRef = useRef(null);
  const isManualTabClick = useRef(false);

  // ─── Scroll Spy ───
  useEffect(() => {
    if (!itinerary || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const handleScroll = () => {
      if (isManualTabClick.current) return;
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
  }, [itinerary]);

  const handleDayTabClick = (dayNum) => {
    setActiveDay(dayNum);
    isManualTabClick.current = true;
    if (dayNum === null) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else if (dayRefs.current[dayNum]) {
      dayRefs.current[dayNum].scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => { isManualTabClick.current = false; }, 1000);
  };

  useEffect(() => {
    const stored = localStorage.getItem("voyager_trips");
    if (stored) { try { setSavedTrips(JSON.parse(stored)); } catch (e) {} }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateRange[0] || !dateRange[1]) {
      setError("Please select travel dates.");
      return;
    }
    
    setIsLoading(true);
    setItinerary(null);
    setIsSaved(false);
    setActiveDay(null);
    setError(null);
    try {
      const computedDays = differenceInDays(dateRange[1], dateRange[0]) + 1;
      const response = await axios.post("http://localhost:5000/api/plan-trip", { 
        ...formData, 
        days: computedDays,
        startDate: format(dateRange[0], "yyyy-MM-dd"),
        endDate: format(dateRange[1], "yyyy-MM-dd")
      });
      setItinerary(response.data);
    } catch (err) {
      console.error("Error planning trip:", err);
      setError("Failed to create itinerary. Please ensure the backend server is running and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentTrip = () => {
    if (!itinerary || isSaved) return;
    const tripToSave = { ...itinerary, id: Date.now(), savedAt: new Date().toISOString() };
    const updated = [tripToSave, ...savedTrips];
    setSavedTrips(updated);
    localStorage.setItem("voyager_trips", JSON.stringify(updated));
    setIsSaved(true);
  };

  const loadTrip = (id) => {
    const trip = savedTrips.find((t) => t.id === id);
    if (trip) { setItinerary(trip); setIsSaved(true); setActiveDay(null); }
  };

  const startNewTrip = () => {
    setItinerary(null);
    setIsSaved(false);
    setActiveDay(null);
    setFormData({ destination: "", origin: "", interests: "", budget: "", pace: "", guests: "" });
    setDateRange([null, null]);
  };

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

  // =========================================
  // LANDING PAGE
  // =========================================
  if (!itinerary && !isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} savedTrips={savedTrips} loadTrip={loadTrip} startNewTrip={startNewTrip} />

        {/* ─── Decorative Background ─── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full animate-float-slow" style={{ background: "radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full animate-float" style={{ background: "radial-gradient(circle, rgba(249, 115, 22, 0.06) 0%, transparent 70%)", animationDelay: "2s" }} />
          <div className="absolute top-1/3 left-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(56, 189, 248, 0.04) 0%, transparent 60%)" }} />
        </div>

        {/* ─── Hero Section ─── */}
        <div className="relative z-10 px-4 py-8 md:py-14">
          <motion.div
            className="max-w-5xl mx-auto flex flex-col items-center relative"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Menu Button */}
            <motion.button
              variants={fadeInUp}
              onClick={() => setSidebarOpen(true)}
              className="absolute left-0 top-0 p-2.5 rounded-xl hover:bg-sky-100/60 transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu size={24} style={{ color: "var(--text)" }} />
            </motion.button>

            {/* Badge */}
            <motion.div variants={fadeInUp} custom={0} className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: "rgba(14, 165, 233, 0.1)", color: "var(--primary)" }}>
              <Sparkles size={14} />
              AI-Powered Trip Planner
            </motion.div>

            {/* Heading */}
            <motion.h1 variants={fadeInUp} custom={1} className="text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tight mb-5 text-center leading-[1.1] min-h-[120px] md:min-h-[180px] lg:min-h-[200px]" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
              <TypewriterHeading text1="Plan Your Dream" text2="Adventure" />
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeInUp} custom={2} className="text-lg md:text-xl mb-10 text-center max-w-2xl font-light leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Personalized travel plans built around your goals and preferences. No pre-packaged tours — just authentic exploring.
            </motion.p>

            {/* ─── Form ─── */}
            <motion.form
              variants={fadeInUp}
              custom={3}
              onSubmit={handleSubmit}
              className="w-full max-w-3xl rounded-3xl p-6 md:p-10 space-y-5 glass-heavy"
              style={{ boxShadow: "var(--shadow-lg)", borderRadius: "var(--radius-lg)" }}
            >
              {/* Row 1: Destination + Days + Guests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative group">
                  <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
                  <input type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="Where to?" required
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm" />
                </div>
                <div className="relative group w-full h-[52px]">
                  <DateRangeInput 
                    startDate={dateRange[0]} 
                    endDate={dateRange[1]} 
                    onChange={(update) => setDateRange(update)} 
                  />
                </div>
                <div className="relative group">
                  <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
                  <select name="guests" value={formData.guests} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm appearance-none cursor-pointer">
                    <option value="">Guests</option>
                    <option value="solo">Solo</option>
                    <option value="couple">Couple</option>
                    <option value="family">Family</option>
                    <option value="group">Group</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Budget + Pace */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 block" style={{ color: "var(--text-light)" }}>Budget</label>
                  <div className="flex gap-2">
                    {[{ val: "$", label: "Budget" }, { val: "$$", label: "Mid-range" }, { val: "$$$", label: "Luxury" }].map(b => (
                      <button key={b.val} type="button" onClick={() => setFormData({ ...formData, budget: b.val })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                          formData.budget === b.val
                            ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200"
                            : "bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:bg-sky-50"
                        }`}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 block" style={{ color: "var(--text-light)" }}>Travel Pace</label>
                  <div className="flex gap-2">
                    {["Relax", "Normal", "Active"].map(p => (
                      <button key={p} type="button" onClick={() => setFormData({ ...formData, pace: p.toLowerCase() })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                          formData.pace === p.toLowerCase()
                            ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200"
                            : "bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:bg-sky-50"
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Interests + Start Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <Heart size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
                  <input type="text" name="interests" value={formData.interests} onChange={handleChange} placeholder="Interests (Optional)"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm" />
                </div>
                <div className="relative group">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
                  <input type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="Start Location (Needed for Flights)" required
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm" />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-sm mt-4 text-center font-medium p-3 rounded-xl border border-red-200" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                  {error}
                </motion.div>
              )}

              {/* CTA Button */}
              <motion.button
                type="submit"
                className="w-full py-4 rounded-xl font-semibold text-lg text-white cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, var(--cta), #FB923C)", boxShadow: "0 4px 14px rgba(249, 115, 22, 0.3)" }}
                whileHover={{ scale: 1.01, boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)" }}
                whileTap={{ scale: 0.99 }}
              >
                <Sparkles size={20} />
                Create Your Trip
                <ArrowRight size={20} />
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </div>
    );
  }

  // =========================================
  // LOADING STATE
  // =========================================
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // =========================================
  // SPLIT-PANEL ITINERARY VIEW
  // =========================================
  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)" }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} savedTrips={savedTrips} loadTrip={loadTrip} startNewTrip={startNewTrip} />

      {/* ─── Top Bar ─── */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between z-10 glass-heavy" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-sky-100/50 transition-colors cursor-pointer" aria-label="Open sidebar">
            <Menu size={20} style={{ color: "var(--text)" }} />
          </button>
          <h1 className="text-lg font-bold hidden md:block gradient-text" style={{ fontFamily: "var(--font-heading)" }}>VoyagerAI</h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={saveCurrentTrip}
            disabled={isSaved}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isSaved
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "text-white border-none"
            }`}
            style={!isSaved ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 2px 8px rgba(14, 165, 233, 0.3)" } : {}}
            whileHover={!isSaved ? { scale: 1.03 } : {}}
            whileTap={!isSaved ? { scale: 0.97 } : {}}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {isSaved ? "Saved!" : "Save Trip"}
          </motion.button>
          <button onClick={startNewTrip} className="px-4 py-2 rounded-xl font-medium text-sm border border-slate-200 hover:bg-sky-50 hover:border-sky-300 transition-colors cursor-pointer" style={{ color: "var(--text)" }}>
            + New Trip
          </button>
        </div>
      </div>

      {/* ─── Day Tabs ─── */}
      <div className="shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => handleDayTabClick(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeDay === null
              ? "text-white shadow-md shadow-sky-200"
              : "bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600"
          }`}
          style={activeDay === null ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" } : {}}
        >
          Overview
        </button>
        {itinerary?.days?.map((day) => (
          <button key={day.day}
            onClick={() => handleDayTabClick(day.day)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeDay === day.day
                ? "text-white shadow-md shadow-sky-200"
                : "bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600"
            }`}
            style={activeDay === day.day ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" } : {}}
          >
            Day {day.day}
          </button>
        ))}
      </div>

      {/* ─── Split Panel ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Itinerary */}
        <div ref={scrollContainerRef} className="w-full md:w-[45%] lg:w-[40%] overflow-y-auto" style={{ borderRight: "1px solid var(--border)", background: "var(--bg)" }}>
          <div className="p-5">

            {/* Overview Card */}
            <motion.div
              ref={(el) => { dayRefs.current[0] = el; }}
              className="mb-6 rounded-2xl overflow-hidden"
              style={{ boxShadow: "var(--shadow-md)", background: "var(--bg-card)" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-6 text-white" style={{ background: "linear-gradient(135deg, #0C4A6E, #0EA5E9, #38BDF8)" }}>
                <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>{itinerary.destination}</h2>
                <p className="text-white/70 text-sm">{itinerary.days?.length || "?"} days • {itinerary.budget_used}</p>
              </div>
              <div className="p-5 space-y-3">
                {itinerary.overview && <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{itinerary.overview}</p>}
                <div className="flex flex-wrap gap-2">
                  {itinerary.currency && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "rgba(14, 165, 233, 0.08)", color: "var(--primary-dark)" }}>
                      <Banknote size={12} /> {itinerary.currency}
                    </span>
                  )}
                  {itinerary.timezone && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "rgba(14, 165, 233, 0.08)", color: "var(--primary-dark)" }}>
                      <Clock size={12} /> {itinerary.timezone}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Flights & Hotels */}
            <div className="space-y-4 mb-6">
              <motion.div className="rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)", background: "var(--bg-card)", border: "1px solid var(--border)" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(14, 165, 233, 0.1)" }}>
                    <Plane size={16} className="text-sky-500" />
                  </div>
                  Flights
                </h3>
                <div className="space-y-2.5">
                  {itinerary.flights?.length > 0 ? itinerary.flights.map((f, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5">
                      <span className="font-medium text-sm truncate max-w-[60%]" style={{ color: "var(--text)" }}>{f.airline}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(14, 165, 233, 0.08)", color: "var(--primary-dark)" }}>{f.price} {f.currency}</span>
                    </div>
                  )) : <p className="text-sm" style={{ color: "var(--text-light)" }}>No flight data available</p>}
                </div>
              </motion.div>

              <motion.div className="rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)", background: "var(--bg-card)", border: "1px solid var(--border)" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                    <Bed size={16} className="text-violet-500" />
                  </div>
                  Hotels
                </h3>
                <div className="space-y-2.5">
                  {itinerary.hotels?.length > 0 ? itinerary.hotels.map((h, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5">
                      <div className="min-w-0">
                        <span className="font-medium text-sm truncate block max-w-[200px]" style={{ color: "var(--text)" }}>{h.name}</span>
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Star size={10} fill="currentColor" /> {h.rating}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(139, 92, 246, 0.08)", color: "#6B21A8" }}>{h.price} {h.currency}</span>
                        {h.url && (
                          <a href={h.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-bold text-white px-3 py-1 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                            style={{ background: "linear-gradient(135deg, var(--cta), #FB923C)" }}>
                            Book
                          </a>
                        )}
                      </div>
                    </div>
                  )) : <p className="text-sm" style={{ color: "var(--text-light)" }}>No hotel data available</p>}
                </div>
              </motion.div>
            </div>

            {/* Day-by-Day Timeline */}
            {(itinerary?.days || []).map((day, dayIndex) => (
              <motion.div
                key={day.day}
                ref={(el) => { dayRefs.current[day.day] = el; }}
                className="mb-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + dayIndex * 0.05, duration: 0.4 }}
              >
                {/* Day Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-md" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 2px 8px rgba(14, 165, 233, 0.3)" }}>
                    {day.day}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>Day {day.day} {day.date ? `· ${day.date}` : ""}</h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{day.theme}</p>
                  </div>
                </div>

                {/* Activities Timeline */}
                <div className="ml-4 pl-6 space-y-0" style={{ borderLeft: "2px solid var(--border)" }}>
                  {day.activities.map((activity, idx) => {
                    const cat = CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.attraction;
                    return (
                      <div key={idx}>
                        {/* Distance Marker */}
                        {idx > 0 && activity.distance_km > 0 && (
                          <div className="flex items-center gap-2 py-2 -ml-[29px]">
                            <div className="w-3 h-3 border-2 rounded-full bg-white" style={{ borderColor: "var(--border)" }} />
                            <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "var(--text-light)" }}>
                              <Navigation size={10} /> {activity.distance_km} km
                            </span>
                          </div>
                        )}

                        {/* Activity Card */}
                        <motion.div
                          ref={(el) => { if (activity.location) activityRefs.current[activity.location] = el; }}
                          className="relative rounded-xl p-4 mb-3 cursor-pointer group"
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
                          onClick={() => handleCardClick(activity)}
                          whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(14, 165, 233, 0.1), 0 2px 8px rgba(0,0,0,0.04)", borderColor: "rgba(14, 165, 233, 0.3)" }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Timeline dot */}
                          <div className="absolute -left-[33px] top-5 w-3 h-3 rounded-full border-2 border-white" style={{ background: "var(--primary)", boxShadow: "0 0 0 2px rgba(14, 165, 233, 0.2)" }} />

                          {/* Category Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>
                              {cat.label}
                            </span>
                          </div>

                          {/* Location */}
                          <h4 className="font-semibold text-[15px] mb-1" style={{ color: "var(--text)" }}>{activity.location}</h4>

                          {/* Time + Cost */}
                          <div className="flex items-center gap-3 text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                            <span className="flex items-center gap-1"><Clock size={12} /> {activity.time}{activity.endTime ? ` - ${activity.endTime}` : ""}</span>
                            {activity.cost && <span className="flex items-center gap-1"><Banknote size={12} /> {activity.cost}</span>}
                          </div>

                          {/* Description */}
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{activity.description}</p>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
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

export default App;
