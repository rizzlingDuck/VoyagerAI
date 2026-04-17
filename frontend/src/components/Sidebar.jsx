import { X, Plus, MapPin, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Sidebar({ isOpen, toggleSidebar, savedTrips, loadTrip, startNewTrip }) {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(12, 74, 110, 0.2)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={toggleSidebar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div
        className="fixed inset-y-0 left-0 w-[300px] z-50 flex flex-col glass-heavy"
        style={{ boxShadow: "var(--shadow-lg)" }}
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-xl font-bold gradient-text" style={{ fontFamily: "var(--font-heading)" }}>My Trips</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{savedTrips.length} saved itineraries</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-sky-100/50 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={20} style={{ color: "var(--text)" }} />
          </button>
        </div>

        {/* New Itinerary Button */}
        <div className="p-4">
          <motion.button
            onClick={() => { startNewTrip(); toggleSidebar(); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 2px 10px rgba(14, 165, 233, 0.3)" }}
            whileHover={{ scale: 1.02, boxShadow: "0 4px 16px rgba(14, 165, 233, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            New Itinerary
          </motion.button>
        </div>

        {/* Saved Trips List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {savedTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(14, 165, 233, 0.08)" }}>
                <MapPin size={24} className="text-sky-300" />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No saved trips yet.</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-light)" }}>Generate an itinerary and save it!</p>
            </div>
          ) : (
            savedTrips.map((trip, index) => (
              <motion.button
                key={trip.id}
                onClick={() => { loadTrip(trip.id); toggleSidebar(); }}
                className="w-full text-left p-4 rounded-xl transition-all cursor-pointer group"
                style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}
                whileHover={{ y: -1, boxShadow: "var(--shadow-md)", borderColor: "rgba(14, 165, 233, 0.3)" }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors" style={{ background: "rgba(14, 165, 233, 0.08)" }}>
                    <MapPin size={16} className="text-sky-500 group-hover:text-sky-600 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: "var(--text)" }}>{trip.destination}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Calendar size={10} />
                        {trip.days?.length || '?'} days
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-light)" }}>•</span>
                      <span className="text-[10px]" style={{ color: "var(--text-light)" }}>
                        {new Date(trip.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}

export default Sidebar;
