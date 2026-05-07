import { motion } from "framer-motion";
import { Menu, Sparkles, LogIn, User, LogOut } from "lucide-react";
import Sidebar from "../Sidebar";
import TripForm from "./TripForm";
import TypewriterHeading from "../common/TypewriterText";
import { staggerContainer, fadeInUp } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";

export default function LandingPage({ formData, dateRange, error, sidebarOpen, savedTrips, onFormChange, onDateChange, onSubmit, onOpenSidebar, onCloseSidebar, onLoadTrip, onStartNewTrip, onOpenAuth }) {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={onCloseSidebar} savedTrips={savedTrips} loadTrip={onLoadTrip} startNewTrip={onStartNewTrip} />

      {/* ─── Decorative Background ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full animate-float-slow" style={{ background: "radial-gradient(circle, rgba(0, 119, 182, 0.08) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full animate-float" style={{ background: "radial-gradient(circle, rgba(249, 115, 22, 0.06) 0%, transparent 70%)", animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(56, 189, 248, 0.04) 0%, transparent 60%)" }} />
      </div>

      {/* ─── Hero Section ─── */}
      <div className="relative z-10 px-4 py-8 md:py-14">
        <motion.div
          className="max-w-5xl mx-auto flex flex-col items-center relative"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Menu Button */}
          <motion.button
            variants={fadeInUp}
            onClick={onOpenSidebar}
            className="absolute left-0 top-0 p-2.5 rounded-xl hover:bg-sky-100/60 transition-colors cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={24} style={{ color: "var(--text)" }} />
          </motion.button>

          {/* Auth Button (top-right) */}
          <motion.div variants={fadeInUp} className="absolute right-0 top-0">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium hidden md:block" style={{ color: "var(--text-muted)" }}>
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer hover:bg-red-50"
                  style={{ color: "var(--text-muted)" }}
                >
                  <LogOut size={15} />
                  <span className="hidden md:block">Sign out</span>
                </button>
              </div>
            ) : (
              <motion.button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "0 2px 10px rgba(14, 165, 233, 0.25)" }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <LogIn size={15} />
                Sign In
              </motion.button>
            )}
          </motion.div>

          {/* Badge */}
          <motion.div variants={fadeInUp} custom={0} className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: "rgba(0, 119, 182, 0.1)", color: "var(--primary)" }}>
            <Sparkles size={14} />
            AI-Powered Trip Planner
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={fadeInUp} custom={1} className="text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tight mb-5 text-center leading-[1.1] min-h-[120px] md:min-h-[180px] lg:min-h-[200px]" style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
            <TypewriterHeading text1="Plan Your Dream" text2="Adventure" />
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={fadeInUp} custom={2} className="text-lg md:text-xl mb-10 text-center max-w-2xl font-light leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Personalized travel plans built around your goals and preferences. No pre-packaged tours — just authentic exploring.
          </motion.p>

          {/* Form */}
          <TripForm
            formData={formData}
            dateRange={dateRange}
            error={error}
            onFormChange={onFormChange}
            onDateChange={onDateChange}
            onSubmit={onSubmit}
          />
        </motion.div>
      </div>
    </div>
  );
}
