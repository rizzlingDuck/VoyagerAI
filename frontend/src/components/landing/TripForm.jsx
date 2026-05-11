import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Users, Heart, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { fadeInUp } from "../../utils/constants";

const DateRangeInput = lazy(() => import("../DateRangeInput"));

export default function TripForm({ formData, dateRange, error, onFormChange, onDateChange, onSubmit }) {
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.destination || formData.destination.trim().length < 2)
      errors.destination = "Please enter a destination (e.g. Tokyo, Japan).";
    if (!formData.origin || formData.origin.trim().length < 2)
      errors.origin = "Please enter your departure city.";
    if (!dateRange[0] || !dateRange[1])
      errors.dates = "Please select your travel dates.";
    else if (dateRange[1] < dateRange[0])
      errors.dates = "Return date must be after departure date.";
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSubmit(e);
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };
  return (
    <motion.form
      variants={fadeInUp}
      custom={3}
      onSubmit={handleSubmit}
      className="w-full max-w-3xl rounded-3xl p-4 sm:p-6 md:p-10 space-y-5 glass-heavy"
      style={{ boxShadow: "var(--shadow-lg)", borderRadius: "var(--radius-lg)" }}
    >
      {/* Row 1: Destination + Days + Guests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="relative group">
            <label htmlFor="destination" className="sr-only">Destination</label>
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
            <input id="destination" type="text" name="destination" value={formData.destination} onChange={(e) => { onFormChange(e); clearFieldError("destination"); }} placeholder="Where to?" required aria-invalid={Boolean(fieldErrors.destination)} aria-describedby={fieldErrors.destination ? "destination-error" : undefined}
              className={`w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm ${
                fieldErrors.destination ? "border-red-400 ring-1 ring-red-300" : "border-slate-200"
              }`} />
          </div>
          {fieldErrors.destination && (
            <p id="destination-error" className="text-red-500 text-[11px] mt-1 ml-1 font-medium">{fieldErrors.destination}</p>
          )}
        </div>
        <div className="relative group w-full">
          <label className="sr-only">Travel dates</label>
          <div className="h-[52px]">
            <Suspense fallback={<DateInputFallback />}>
              <DateRangeInput
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                onChange={(update) => { onDateChange(update); clearFieldError("dates"); }}
              />
            </Suspense>
          </div>
          {fieldErrors.dates && (
            <p className="text-red-500 text-[11px] mt-1 ml-1 font-medium">{fieldErrors.dates}</p>
          )}
        </div>
        <div className="relative group">
          <label htmlFor="guests" className="sr-only">Guests</label>
          <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
          <select id="guests" name="guests" value={formData.guests} onChange={onFormChange}
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
        <fieldset>
          <legend className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 block" style={{ color: "var(--text-light)" }}>Budget</legend>
          <div className="grid grid-cols-3 gap-2">
            {[{ val: "$", label: "Budget" }, { val: "$$", label: "Mid-range" }, { val: "$$$", label: "Luxury" }].map(b => (
              <button key={b.val} type="button" onClick={() => onFormChange({ target: { name: "budget", value: b.val } })}
                aria-pressed={formData.budget === b.val}
                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border min-h-[42px] ${
                  formData.budget === b.val
                    ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:bg-sky-50"
                }`}>
                {b.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 block" style={{ color: "var(--text-light)" }}>Travel Pace</legend>
          <div className="grid grid-cols-3 gap-2">
            {["Relax", "Normal", "Active"].map(p => (
              <button key={p} type="button" onClick={() => onFormChange({ target: { name: "pace", value: p.toLowerCase() } })}
                aria-pressed={formData.pace === p.toLowerCase()}
                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border min-h-[42px] ${
                  formData.pace === p.toLowerCase()
                    ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:bg-sky-50"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Row 3: Interests + Start Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <label htmlFor="interests" className="sr-only">Interests</label>
          <Heart size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
          <input id="interests" type="text" name="interests" value={formData.interests} onChange={onFormChange} placeholder="Interests (Optional)"
            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm" />
        </div>
        <div>
          <div className="relative group">
            <label htmlFor="origin" className="sr-only">Start location</label>
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
            <input id="origin" type="text" name="origin" value={formData.origin} onChange={(e) => { onFormChange(e); clearFieldError("origin"); }} placeholder="Start Location (Needed for Flights)" required aria-invalid={Boolean(fieldErrors.origin)} aria-describedby={fieldErrors.origin ? "origin-error" : undefined}
              className={`w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-sm ${
                fieldErrors.origin ? "border-red-400 ring-1 ring-red-300" : "border-slate-200"
              }`} />
          </div>
          {fieldErrors.origin && (
            <p id="origin-error" className="text-red-500 text-[11px] mt-1 ml-1 font-medium">{fieldErrors.origin}</p>
          )}
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

function DateInputFallback() {
  return (
    <button
      type="button"
      disabled
      className="w-full h-full pl-4 pr-4 py-3.5 flex items-center rounded-xl bg-white border border-slate-200 text-slate-400 font-medium text-sm shadow-sm shadow-black/5"
    >
      Select dates
    </button>
  );
}
