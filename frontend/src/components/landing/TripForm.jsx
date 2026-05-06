import { motion } from "framer-motion";
import { Globe, Users, Heart, MapPin, Sparkles, ArrowRight } from "lucide-react";
import DateRangeInput from "../DateRangeInput";
import { fadeInUp } from "../../utils/constants";

export default function TripForm({ formData, dateRange, error, onFormChange, onDateChange, onSubmit }) {
  return (
    <motion.form
      variants={fadeInUp}
      custom={3}
      onSubmit={onSubmit}
      className="w-full max-w-3xl rounded-3xl p-6 md:p-10 space-y-5 glass-heavy"
      style={{ boxShadow: "var(--shadow-lg)", borderRadius: "var(--radius-lg)" }}
    >
      {/* Row 1: Destination + Days + Guests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group">
          <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
          <input type="text" name="destination" value={formData.destination} onChange={onFormChange} placeholder="Where to?" required
            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm" />
        </div>
        <div className="relative group w-full h-[52px]">
          <DateRangeInput 
            startDate={dateRange[0]} 
            endDate={dateRange[1]} 
            onChange={onDateChange} 
          />
        </div>
        <div className="relative group">
          <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
          <select name="guests" value={formData.guests} onChange={onFormChange}
            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm appearance-none cursor-pointer">
            <option value="">Guests</option>
            <option value="solo">Solo</option>
            <option value="couple">Couple</option>
            <option value="family">Family</option>
            <option value="group">Group</option>
          </select>
        </div>
      </div>

      {/* Row 2: Budget + Pace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 block" style={{ color: "var(--text-light)" }}>Budget</label>
          <div className="flex gap-2">
            {[{ val: "$", label: "Budget" }, { val: "$$", label: "Mid-range" }, { val: "$$$", label: "Luxury" }].map(b => (
              <button key={b.val} type="button" onClick={() => onFormChange({ target: { name: "budget", value: b.val } })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                  formData.budget === b.val
                    ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:bg-sky-50"
                }`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 block" style={{ color: "var(--text-light)" }}>Travel Pace</label>
          <div className="flex gap-2">
            {["Relax", "Normal", "Active"].map(p => (
              <button key={p} type="button" onClick={() => onFormChange({ target: { name: "pace", value: p.toLowerCase() } })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                  formData.pace === p.toLowerCase()
                    ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:bg-sky-50"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Interests + Start Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <Heart size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
          <input type="text" name="interests" value={formData.interests} onChange={onFormChange} placeholder="Interests (Optional)"
            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm" />
        </div>
        <div className="relative group">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
          <input type="text" name="origin" value={formData.origin} onChange={onFormChange} placeholder="Start Location (Needed for Flights)" required
            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm" />
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-sm mt-4 text-center font-medium p-3 rounded-xl border border-red-200" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
          {error}
        </motion.div>
      )}

      {/* CTA Button */}
      <motion.button
        type="submit"
        className="w-full py-4 rounded-xl font-semibold text-lg text-white cursor-pointer flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, var(--cta), #FB923C)", boxShadow: "0 4px 14px rgba(249, 115, 22, 0.3)" }}
        whileHover={{ scale: 1.01, boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)" }}
        whileTap={{ scale: 0.99 }}
      >
        <Sparkles size={20} />
        Create Your Trip
        <ArrowRight size={20} />
      </motion.button>
    </motion.form>
  );
}
