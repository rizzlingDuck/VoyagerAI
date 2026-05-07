import { forwardRef } from "react";
import { motion } from "framer-motion";
import ActivityCard from "./ActivityCard";

const DayTimeline = forwardRef(function DayTimeline({ day, dayIndex, activityRefs, onCardClick }, ref) {
  return (
    <motion.div
      ref={ref}
      className="mb-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + dayIndex * 0.05, duration: 0.4 }}
    >
      {/* Day Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-md" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 2px 8px rgba(0, 119, 182, 0.3)" }}>
          {day.day}
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>Day {day.day} {day.date ? `· ${day.date}` : ""}</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{day.theme}</p>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="ml-4 pl-6 space-y-0" style={{ borderLeft: "2px solid var(--border)" }}>
        {day.activities.map((activity, idx) => (
          <ActivityCard
            key={idx}
            ref={(el) => { if (activity.location) activityRefs.current[activity.location] = el; }}
            activity={activity}
            index={idx}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </motion.div>
  );
});

export default DayTimeline;
