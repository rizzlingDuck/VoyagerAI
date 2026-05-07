import { motion, AnimatePresence } from "framer-motion";
import { Plane, Bed, MapPin, Search, Check, Loader2, AlertCircle, Sparkles, Brain, Wand2 } from "lucide-react";

const TOOL_ICONS = {
  findFlights: Plane,
  searchHotels: Bed,
  getCoordinates: MapPin,
  searchWeb: Search,
};

const PHASE_CONFIG = {
  started:      { icon: Sparkles, color: "#0EA5E9", label: "Initializing" },
  reasoning:    { icon: Brain,    color: "#8B5CF6", label: "AI Reasoning" },
  planning:     { icon: Brain,    color: "#8B5CF6", label: "Analyzing" },
  fetching:     { icon: Search,   color: "#F97316", label: "Fetching Data" },
  synthesizing: { icon: Wand2,    color: "#10B981", label: "Crafting Itinerary" },
};

export default function StreamingLoader({ phase, phaseMessage, toolEvents }) {
  const phaseInfo = PHASE_CONFIG[phase] || PHASE_CONFIG.started;
  const PhaseIcon = phaseInfo.icon;

  const doneCount = toolEvents.filter((t) => t.status === "done").length;
  const totalCount = toolEvents.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ─── Phase Header ─── */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: `${phaseInfo.color}15` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <PhaseIcon size={28} style={{ color: phaseInfo.color }} />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1" style={{ color: phaseInfo.color }}>
                {phaseInfo.label}
              </p>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
                {phaseMessage}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Progress Bar ─── */}
        {totalCount > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              <span>{doneCount} of {totalCount} sources fetched</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${phaseInfo.color}, #38BDF8)` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* ─── Tool Cards ─── */}
        <div className="space-y-2.5">
          <AnimatePresence>
            {toolEvents.map((tool, index) => (
              <ToolCard key={tool.tool + index} tool={tool} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {/* ─── Synthesizing Phase Visual ─── */}
        {phase === "synthesizing" && (
          <motion.div
            className="mt-6 p-4 rounded-xl text-center"
            style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Wand2 size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">AI is writing your itinerary</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Building day-by-day activities, mapping coordinates, estimating budget...
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function ToolCard({ tool, index }) {
  const Icon = TOOL_ICONS[tool.tool] || Search;
  const isRunning = tool.status === "running";
  const isDone = tool.status === "done";
  const isError = tool.status === "error";

  return (
    <motion.div
      className="rounded-xl p-3.5 flex items-start gap-3"
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${isDone ? "rgba(16, 185, 129, 0.2)" : isError ? "rgba(239, 68, 68, 0.2)" : "var(--border)"}`,
        boxShadow: isDone ? "0 2px 8px rgba(16, 185, 129, 0.06)" : "var(--shadow-sm)",
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      layout
    >
      {/* Status Icon */}
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" style={{ background: isDone ? "rgba(16, 185, 129, 0.1)" : isError ? "rgba(239, 68, 68, 0.1)" : "rgba(0, 119, 182, 0.1)" }}>
        {isRunning && <Loader2 size={16} className="text-sky-500 animate-spin" />}
        {isDone && <Check size={16} className="text-emerald-500" />}
        {isError && <AlertCircle size={16} className="text-red-500" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color: "var(--text-muted)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{tool.label}</span>
          {isRunning && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">
              fetching...
            </span>
          )}
        </div>

        {/* Preview Data */}
        <AnimatePresence>
          {isDone && tool.preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-1.5"
            >
              <ToolPreview tool={tool} />
            </motion.div>
          )}
        </AnimatePresence>

        {isError && (
          <p className="text-xs text-red-500 mt-1">{tool.error || "Failed to fetch"}</p>
        )}
      </div>
    </motion.div>
  );
}

function ToolPreview({ tool }) {
  const preview = tool.preview;
  if (!preview) return null;

  // Flight preview
  if (tool.tool === "findFlights" && preview.items) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {preview.items.map((f, i) => (
          <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(0, 119, 182, 0.08)", color: "#075985" }}>
            {f.airline} · {f.price} {f.currency}
          </span>
        ))}
        {preview.count > 3 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: "var(--text-light)" }}>
            +{preview.count - 3} more
          </span>
        )}
      </div>
    );
  }

  // Hotel preview
  if (tool.tool === "searchHotels" && preview.items) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {preview.items.map((h, i) => (
          <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(139, 92, 246, 0.08)", color: "#6B21A8" }}>
            {h.name} · ★{h.rating}
          </span>
        ))}
        {preview.count > 3 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: "var(--text-light)" }}>
            +{preview.count - 3} more
          </span>
        )}
      </div>
    );
  }

  // Geocode preview
  if (tool.tool === "getCoordinates" && preview.name) {
    return (
      <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
        📍 {preview.name.split(",").slice(0, 2).join(",")}
      </span>
    );
  }

  // Web search preview
  if (tool.tool === "searchWeb") {
    return (
      <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
        {preview.summary || `${preview.count} sources found`}
      </span>
    );
  }

  return null;
}
