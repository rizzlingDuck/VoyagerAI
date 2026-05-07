import { motion } from "framer-motion";
import { Plane } from "lucide-react";

export default function FlightsCard({ flights }) {
  return (
    <motion.div className="rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)", background: "var(--bg-card)", border: "1px solid var(--border)" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 119, 182, 0.1)" }}>
          <Plane size={16} className="text-sky-500" />
        </div>
        Flights
      </h3>
      <div className="space-y-2.5">
        {flights?.length > 0 ? flights.map((f, i) => (
          <div key={i} className="flex justify-between items-center py-1.5">
            <span className="font-medium text-sm truncate max-w-[60%]" style={{ color: "var(--text)" }}>{f.airline}</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(0, 119, 182, 0.08)", color: "var(--primary-dark)" }}>{f.price} {f.currency}</span>
          </div>
        )) : <p className="text-sm" style={{ color: "var(--text-light)" }}>No flight data available</p>}
      </div>
    </motion.div>
  );
}
