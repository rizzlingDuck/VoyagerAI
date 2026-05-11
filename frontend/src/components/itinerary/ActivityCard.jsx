import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Clock, Banknote, Navigation } from "lucide-react";
import { CATEGORY_COLORS } from "../../utils/constants";

const ActivityCard = forwardRef(function ActivityCard({ activity, index, onCardClick }, ref) {
  const cat = CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.attraction;

  return (
    <div>
      {/* Distance Marker */}
      {index > 0 && activity.distance_km > 0 && (
        <div className="flex items-center gap-2 py-2 -ml-[29px]">
          <div className="w-3 h-3 border-2 rounded-full bg-white" style={{ borderColor: "var(--border)" }} />
          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "var(--text-light)" }}>
            <Navigation size={10} /> {activity.distance_km} km
          </span>
        </div>
      )}

      {/* Activity Card */}
      <motion.button
        ref={ref}
        type="button"
        className="relative rounded-xl p-4 mb-3 cursor-pointer group w-full text-left"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        onClick={() => onCardClick?.(activity)}
        aria-label={`Show ${activity.location} on the map`}
        whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0, 119, 182, 0.1), 0 2px 8px rgba(0,0,0,0.04)", borderColor: "rgba(0, 119, 182, 0.3)" }}
        transition={{ duration: 0.2 }}
      >
        {/* Timeline dot */}
        <div className="absolute -left-[33px] top-5 w-3 h-3 rounded-full border-2 border-white" style={{ background: "var(--primary)", boxShadow: "0 0 0 2px rgba(0, 119, 182, 0.2)" }} />

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
      </motion.button>
    </div>
  );
});

export default ActivityCard;
