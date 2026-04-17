import React, { forwardRef, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, addDays } from "date-fns";
import { Calendar, X } from "lucide-react";

export default function DateRangeInput({ startDate, endDate, onChange }) {
  const datePickerRef = useRef(null);
  
  // Calculate total inclusive days
  const totalDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  
  let displayText = "Select Dates";
  if (startDate && endDate) {
    displayText = `${format(startDate, "do MMM")} - ${format(endDate, "do MMM")} (${totalDays} ${totalDays === 1 ? 'day' : 'days'})`;
  } else if (startDate) {
    displayText = `${format(startDate, "do MMM")} - ...`;
  }

  // Custom Input
  const CustomInput = forwardRef(({ onClick }, ref) => (
    <div className="relative group w-full cursor-pointer h-full" onClick={onClick} ref={ref}>
      <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition-colors group-hover:text-sky-600" />
      <div 
        className="w-full pl-10 pr-10 py-3.5 h-full flex items-center rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-medium text-[13px] sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis shadow-sm shadow-black/5"
      >
        <span className={startDate ? "text-slate-800" : "text-slate-400"}>{displayText}</span>
      </div>
      {startDate && (
        <div 
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onChange([null, null]);
          }}
        >
          <X size={14} />
        </div>
      )}
    </div>
  ));

  return (
    <div className="relative w-full h-full date-range-picker-wrapper [&_.react-datepicker-wrapper]:w-full [&_.react-datepicker-wrapper]:h-full [&_.react-datepicker__input-container]:h-full">
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
        onChange={(update) => {
          onChange(update);
        }}
        monthsShown={2}
        customInput={<CustomInput />}
        minDate={new Date()}
        maxDate={startDate && !endDate ? addDays(startDate, 9) : null}
        ref={datePickerRef}
        shouldCloseOnSelect={false}
        // Inject MCP popover styles into the wrapper
        calendarClassName="!rounded-xl !border !border-slate-200 !bg-white !p-4 !text-slate-800 !shadow-[0_8px_30px_rgb(0,0,0,0.08)] !font-sans !overflow-hidden z-[100] !w-max"
        dayClassName={(date) => 
          "!text-slate-700 !w-8 !h-8 !leading-8 !m-0 transition-colors focus:!outline-none"
        }
      >
        <div className="ok-button-container flex justify-center mt-3 mb-1 w-full" style={{ flexBasis: "100%" }}>
          <button 
            type="button" 
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-medium px-8 py-1.5 rounded-full text-sm transition-colors shadow-sm"
            onClick={() => datePickerRef.current.setOpen(false)}
          >
            OK
          </button>
        </div>
      </DatePicker>
      {/* Small inline style to override ugly selected date styles in react-datepicker to match Sky theme */}
      <style>{`
        /* Use bulletproof inline-block for side-by-side layout */
        .react-datepicker {
          border: none !important;
          display: inline-block !important;
        }
        .react-datepicker__month-container {
          display: inline-block !important;
          vertical-align: top;
          margin: 0 8px !important;
        }
        .ok-button-container {
          display: block;
          clear: both;
          text-align: center;
          margin-top: 8px;
        }

        /* Hover state for normal days */
        .react-datepicker__day:hover:not(.react-datepicker__day--in-range) {
          border-radius: 9999px !important;
          background-color: #e0f2fe !important;
        }

        /* Range connection */
        .react-datepicker__day--in-range,
        .react-datepicker__day--in-selecting-range {
          background-color: #e0f2fe !important;
          color: #0ea5e9 !important;
          border-radius: 0px !important;
        }
        
        /* Start/End styling to match exact mockup (solid blue circle) */
        .react-datepicker__day--range-start,
        .react-datepicker__day--selecting-range-start {
          background-color: #0ea5e9 !important;
          color: white !important;
          border-top-left-radius: 9999px !important;
          border-bottom-left-radius: 9999px !important;
        }
        .react-datepicker__day--range-end {
          background-color: #0ea5e9 !important;
          color: white !important;
          border-top-right-radius: 9999px !important;
          border-bottom-right-radius: 9999px !important;
        }

        /* Fallback for single selected item */
        .react-datepicker__day--selected:not(.react-datepicker__day--in-range) {
           background-color: #0ea5e9 !important;
           color: white !important;
           border-radius: 9999px !important;
        }

        .react-datepicker__day--keyboard-selected:not(.react-datepicker__day--in-range) {
          background-color: transparent !important;
          color: #334155 !important;
        }

        .react-datepicker__header {
          background-color: transparent !important;
          border-bottom: none !important;
          padding-top: 0 !important;
        }
        .react-datepicker__current-month, 
        .react-datepicker-time__header {
          font-weight: 600 !important;
          font-size: 0.9rem !important;
          color: #0f172a !important;
          margin-bottom: 8px !important;
        }
        .react-datepicker__day-names {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 4px;
          padding-bottom: 4px;
        }
        .react-datepicker__day-name {
          color: #64748b !important;
          font-weight: 500 !important;
          font-size: 0.75rem !important;
          width: 2rem !important;
        }
        .react-datepicker__navigation {
          top: 16px !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #64748b !important;
          border-width: 2px 2px 0 0 !important;
        }
      `}</style>
    </div>
  );
}
