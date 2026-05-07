import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Banknote, Clock } from "lucide-react";

const OverviewCard = forwardRef(function OverviewCard({ itinerary }, ref) {
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
      </div>
    </motion.div>
  );
});

export default OverviewCard;
