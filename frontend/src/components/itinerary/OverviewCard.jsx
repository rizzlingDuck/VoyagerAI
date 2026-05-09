import { useState } from "react";
import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Banknote, Clock, Info, ChevronDown, ChevronUp, Plane, Bed, MapPin } from "lucide-react";

const OverviewCard = forwardRef(function OverviewCard({ itinerary }, ref) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const bd = itinerary.budget_breakdown;

  return (
    <motion.div
      ref={ref}
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
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "rgba(0, 119, 182, 0.08)", color: "var(--primary-dark)" }}>
              <Banknote size={12} /> {itinerary.currency}
            </span>
          )}
          {itinerary.timezone && (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "rgba(0, 119, 182, 0.08)", color: "var(--primary-dark)" }}>
              <Clock size={12} /> {itinerary.timezone}
            </span>
          )}
        </div>

        {/* Budget Breakdown Accordion */}
        {bd && bd.total > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:underline transition-all"
              style={{ color: "var(--primary)" }}
            >
              <Info size={12} />
              How is this budget calculated?
              {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <AnimatePresence>
              {showBreakdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 p-3 rounded-xl text-xs space-y-1.5"
                  style={{ background: "rgba(0, 119, 182, 0.04)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1.5"><Plane size={11} /> Cheapest flight (round-trip)</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>${bd.flight.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1.5"><Bed size={11} /> Hotel (${bd.hotelPerNight}/night × {bd.hotelNights} nights)</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>${bd.hotelTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1.5"><MapPin size={11} /> Activities & meals</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>${bd.activities.toLocaleString()}</span>
                  </div>
                  <div className="pt-1.5 mt-1.5 flex items-center justify-between font-semibold" style={{ borderTop: "1px solid var(--border)", color: "var(--primary-dark)" }}>
                    <span>Total estimated</span>
                    <span>${bd.total.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default OverviewCard;
