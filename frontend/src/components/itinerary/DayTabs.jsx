export default function DayTabs({ days, activeDay, onDayTabClick }) {
  return (
    <div className="shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => onDayTabClick(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
          activeDay === null
            ? "text-white shadow-md shadow-sky-200"
            : "bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600"
        }`}
        style={activeDay === null ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" } : {}}
      >
        Overview
      </button>
      {days?.map((day) => (
        <button key={day.day}
          onClick={() => onDayTabClick(day.day)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeDay === day.day
              ? "text-white shadow-md shadow-sky-200"
              : "bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600"
          }`}
          style={activeDay === day.day ? { background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" } : {}}
        >
          Day {day.day}
        </button>
      ))}
    </div>
  );
}
