import { Component } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * React Error Boundary — catches render errors in the ItineraryView
 * and displays a friendly fallback UI instead of a blank white crash screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught render error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ background: "var(--bg)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6 max-w-md text-center"
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
          >
            <AlertTriangle size={36} className="text-red-400" />
          </div>

          {/* Heading */}
          <div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
            >
              Something went wrong
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              The itinerary couldn&apos;t be displayed. This sometimes happens with unusual
              destinations or edge cases in the AI response.
            </p>
          </div>

          {/* Error details (dev-friendly) */}
          {this.state.error && (
            <details
              className="w-full text-left rounded-xl p-4 text-xs font-mono"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <summary className="cursor-pointer font-semibold mb-2 text-red-400">
                Error details
              </summary>
              <pre className="whitespace-pre-wrap break-all">{this.state.error.message}</pre>
            </details>
          )}

          {/* Reset button */}
          <motion.button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
            whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(14, 165, 233, 0.35)" }}
            whileTap={{ scale: 0.97 }}
          >
            <RotateCcw size={16} />
            Plan a new trip
          </motion.button>
        </motion.div>
      </div>
    );
  }
}

export default ErrorBoundary;
