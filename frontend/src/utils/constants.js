// ─────────────── Category Config ───────────────
export const CATEGORY_COLORS = {
  attraction: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD", label: "Attraction" },
  breakfast:  { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74", label: "Breakfast" },
  lunch:      { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", label: "Lunch" },
  dinner:     { bg: "#F3E8FF", text: "#6B21A8", border: "#C4B5FD", label: "Dinner" },
  transport:  { bg: "#E0F2FE", text: "#075985", border: "#7DD3FC", label: "Transport" },
  shopping:   { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4", label: "Shopping" },
  nature:     { bg: "#DCFCE7", text: "#166534", border: "#86EFAC", label: "Nature" },
  nightlife:  { bg: "#FDF4FF", text: "#86198F", border: "#E879F9", label: "Nightlife" },
};

// ─────────────── Animation Variants ───────────────
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};
