import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUSES = [
  "Searching flights & routes...",
  "Finding the best hotels...",
  "Curating local experiences...",
  "Building your perfect itinerary...",
];

export default function LoadingSpinner() {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUSES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8" style={{ background: "var(--bg)" }}>
      {/* Spinner */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full blur-xl animate-glow-pulse" style={{ background: "rgba(0, 119, 182, 0.15)" }} />
        {/* Outer dashed ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-sky-300/40" style={{ animation: "spin-slow 10s linear infinite" }} />
        {/* Main arc */}
        <div className="absolute inset-[4px] rounded-full border-[3px] border-transparent border-t-sky-500 border-r-sky-400/30" style={{ animation: "spin-slow 1.5s linear infinite", boxShadow: "0 0 12px rgba(0, 119, 182, 0.3)" }} />
        {/* Reverse arc */}
        <div className="absolute inset-[12px] rounded-full border-[2px] border-transparent border-b-orange-400" style={{ animation: "spin-reverse 2.5s linear infinite", boxShadow: "0 0 8px rgba(249, 115, 22, 0.3)" }} />
        {/* Inner ring */}
        <div className="absolute inset-[20px] rounded-full border border-transparent border-l-sky-600/60" style={{ animation: "spin-slow 1s ease-in-out infinite" }} />
        {/* Center dot */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" style={{ boxShadow: "0 0 10px rgba(0, 119, 182, 0.6)" }} />
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
            {STATUSES[statusIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          AI is gathering live data from multiple sources
        </p>
      </div>
    </div>
  );
}
