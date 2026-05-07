import { X, Plus, MapPin, Calendar, LogIn, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function Sidebar({ isOpen, toggleSidebar, savedTrips, loadTrip, startNewTrip, onOpenAuth }) {
  const { user, signOut } = useAuth();
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
            {user ? (
              <p className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: "var(--text-muted)" }}>{user.email}</p>
            ) : (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Sign in to save trips</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {user && (
              <button
                onClick={signOut}
                className="p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={17} style={{ color: "var(--text-muted)" }} />
              </button>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-sky-100/50 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={20} style={{ color: "var(--text)" }} />
            </button>
          </div>
        </div>

        {/* New Itinerary Button */}
        <div className="p-4">
          <motion.button
            onClick={() => { startNewTrip(); toggleSidebar(); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 2px 10px rgba(0, 119, 182, 0.3)" }}
            whileHover={{ scale: 1.02, boxShadow: "0 4px 16px rgba(0, 119, 182, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            New Itinerary
          </motion.button>
        </div>

        {/* Trip list or auth CTA */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {!user ? (
            <div className="text-center py-12 px-2">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(0, 119, 182, 0.08)" }}>
                <LogIn size={24} className="text-sky-400" />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Sign in to save trips</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-light)" }}>Your itineraries sync across all devices.</p>
              <motion.button
                onClick={() => { toggleSidebar(); onOpenAuth?.(); }}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Sign In
              </motion.button>
            </div>
          ) : savedTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(0, 119, 182, 0.08)" }}>
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
                whileHover={{ y: -1, boxShadow: "var(--shadow-md)", borderColor: "rgba(0, 119, 182, 0.3)" }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors" style={{ background: "rgba(0, 119, 182, 0.08)" }}>
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
