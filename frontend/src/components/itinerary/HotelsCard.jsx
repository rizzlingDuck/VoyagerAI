import { motion } from "framer-motion";
import { Bed, Star } from "lucide-react";

export default function HotelsCard({ hotels }) {
  return (
    <motion.div className="rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)", background: "var(--bg-card)", border: "1px solid var(--border)" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
          <Bed size={16} className="text-violet-500" />
        </div>
        Hotels
      </h3>
      <div className="space-y-2.5">
        {hotels?.length > 0 ? hotels.map((h, i) => (
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
  );
}
