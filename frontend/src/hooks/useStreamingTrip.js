import { useState, useCallback, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Custom hook for SSE-based trip generation.
 * Connects to the streaming endpoint and progressively emits events.
 *
 * Returns:
 *  - status: 'idle' | 'streaming' | 'complete' | 'error'
 *  - phase: current pipeline phase string
 *  - phaseMessage: human-readable phase description
 *  - toolEvents: array of { tool, label, status, preview }
 *  - itinerary: final itinerary (only set on complete)
 *  - error: error message if failed
 *  - startTrip(formData): trigger function
 */
export default function useStreamingTrip() {
  const [status, setStatus] = useState("idle");
  const [phase, setPhase] = useState("");
  const [phaseMessage, setPhaseMessage] = useState("");
  const [toolEvents, setToolEvents] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const startTrip = useCallback(async (formData) => {
    // Reset
    setStatus("streaming");
    setPhase("started");
    setPhaseMessage("Planning your adventure...");
    setToolEvents([]);
    setItinerary(null);
    setError(null);

    // Allow aborting
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch(`${API_URL}/api/plan-trip-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // keep the incomplete part

        for (const block of parts) {
          if (!block.trim()) continue;
          const eventMatch = block.match(/^event:\s*(.+)$/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1].trim();
            let data;
            try {
              data = JSON.parse(dataMatch[1].trim());
            } catch {
              continue;
            }
            handleEvent(eventType, data);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Streaming error:", err);
      setError(err.message || "Connection to server failed");
      setStatus("error");
    }
  }, []);

  function handleEvent(eventType, data) {
    switch (eventType) {
      case "status":
        setPhase(data.phase);
        setPhaseMessage(data.message);
        break;

      case "tool_start":
        setToolEvents((prev) => [
          ...prev,
          { tool: data.tool, label: data.label, status: "running", preview: null },
        ]);
        break;

      case "tool_complete":
        setToolEvents((prev) =>
          prev.map((t) =>
            t.tool === data.tool
              ? { ...t, status: "done", preview: data.preview }
              : t
          )
        );
        break;

      case "tool_error":
        setToolEvents((prev) =>
          prev.map((t) =>
            t.tool === data.tool
              ? { ...t, status: "error", error: data.error }
              : t
          )
        );
        break;

      case "complete":
        setItinerary(data);
        setStatus("complete");
        setPhase("complete");
        setPhaseMessage("Your itinerary is ready!");
        break;

      case "error":
        setError(data.message);
        setStatus("error");
        break;

      default:
        break;
    }
  }

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  return { status, phase, phaseMessage, toolEvents, itinerary, error, startTrip, abort };
}
