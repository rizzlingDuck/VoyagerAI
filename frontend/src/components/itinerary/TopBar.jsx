import { motion } from "framer-motion";
import { Menu, Bookmark, BookmarkCheck } from "lucide-react";

export default function TopBar({ isSaved, sidebarOpen, onSave, onNewTrip, onOpenSidebar }) {
  return (
    <div className="shrink-0 px-4 py-3 flex items-center justify-between z-10 glass-heavy" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3">
        <button onClick={onOpenSidebar} className="p-2 rounded-xl hover:bg-sky-100/50 transition-colors cursor-pointer" aria-label="Open sidebar">
          <Menu size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-lg font-bold hidden md:block gradient-text" style={{ fontFamily: "var(--font-heading)" }}>VoyagerAI</h1>
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          onClick={onSave}
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
        <button onClick={onNewTrip} className="px-4 py-2 rounded-xl font-medium text-sm border border-slate-200 hover:bg-sky-50 hover:border-sky-300 transition-colors cursor-pointer" style={{ color: "var(--text)" }}>
          + New Trip
        </button>
      </div>
    </div>
  );
}
