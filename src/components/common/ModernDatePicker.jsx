import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

export default function ModernDatePicker({
  value,
  onChange,
  minDate = new Date().toISOString().split('T')[0],
  visitDays,
  visitTimings
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse allowed days of week from vendor's visitDays string
  const getAllowedDaysOfWeek = (daysStr) => {
    if (!daysStr || typeof daysStr !== 'string') return null;
    const str = daysStr.toLowerCase().trim();
    if (!str || str.includes('365') || str.includes('appointment') || str.includes('festive') || str.includes('all')) {
      return null;
    }

    const allowed = new Set();

    if (str.includes('weekend')) {
      allowed.add(0); // Sun
      allowed.add(6); // Sat
    }
    if (str.includes('weekday')) {
      allowed.add(1); allowed.add(2); allowed.add(3); allowed.add(4); allowed.add(5);
    }
    if (str.includes('mon–sat') || str.includes('mon-sat')) {
      allowed.add(1); allowed.add(2); allowed.add(3); allowed.add(4); allowed.add(5); allowed.add(6);
    }

    if (str.includes('sun')) allowed.add(0);
    if (str.includes('mon')) allowed.add(1);
    if (str.includes('tue')) allowed.add(2);
    if (str.includes('wed')) allowed.add(3);
    if (str.includes('thu')) allowed.add(4);
    if (str.includes('fri')) allowed.add(5);
    if (str.includes('sat')) allowed.add(6);

    return allowed.size > 0 ? Array.from(allowed) : null;
  };

  const allowedDays = getAllowedDaysOfWeek(visitDays);

  // Parse current value or fallback to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  // View state for navigating months in calendar
  const [viewDate, setViewDate] = useState(() => {
    return selectedDate && !isNaN(selectedDate.getTime()) ? new Date(selectedDate) : new Date();
  });

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // First day of week for current month (0 = Sun, 1 = Mon...)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Navigation handlers
  const prevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  // Format date helper: YYYY-MM-DD
  const formatYMD = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Date select handler
  const handleSelectDate = (day) => {
    const dateStr = formatYMD(year, month, day);
    onChange(dateStr);
    setIsOpen(false);
  };

  // Check if date string is disabled (before minDate or closed on vendor schedule)
  const isDisabled = (day) => {
    const dateStr = formatYMD(year, month, day);
    if (dateStr < minDate) return true;

    if (allowedDays && allowedDays.length > 0) {
      const d = new Date(year, month, day);
      if (!allowedDays.includes(d.getDay())) return true;
    }
    return false;
  };

  // Check if date is selected
  const isSelected = (day) => {
    if (!value) return false;
    return formatYMD(year, month, day) === value;
  };

  // Check if date is today
  const isToday = (day) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return formatYMD(year, month, day) === todayStr;
  };

  // Presets
  const setPreset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    // Find next valid day if offset date is disabled
    let attempts = 0;
    while (attempts < 14) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isPast = dateStr < minDate;
      const isClosed = allowedDays && !allowedDays.includes(dayOfWeek);

      if (!isPast && !isClosed) {
        onChange(dateStr);
        setViewDate(d);
        setIsOpen(false);
        return;
      }
      d.setDate(d.getDate() + 1);
      attempts++;
    }
  };

  const setSaturdayPreset = () => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSaturday);
    const dateStr = d.toISOString().split('T')[0];
    if (!allowedDays || allowedDays.includes(6)) {
      onChange(dateStr);
      setViewDate(d);
      setIsOpen(false);
    } else {
      setPreset(1);
    }
  };

  // Format display string on trigger button
  const getDisplayText = () => {
    if (!value) return 'Select visit date...';
    try {
      const d = new Date(value + 'T00:00:00');
      if (isNaN(d.getTime())) return value;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-2xl border-2 transition-all flex items-center justify-between shadow-xs bg-white text-left ${
          isOpen
            ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-md'
            : value
            ? 'border-emerald-500/40 hover:border-emerald-500/60'
            : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`p-2 rounded-xl transition-colors ${value ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 text-slate-400'}`}>
            <CalendarIcon size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Visit Date</span>
            <span className={`text-xs font-bold truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
              {getDisplayText()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Clear date"
            >
              <X size={14} />
            </span>
          )}
          <ChevronRight size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-90 text-emerald-600' : ''}`} />
        </div>
      </button>

      {/* Expandable Custom Calendar Card */}
      {isOpen && (
        <div className="mt-2.5 w-full bg-slate-50/90 border-2 border-emerald-500/25 rounded-3xl p-3.5 shadow-lg shadow-emerald-950/5 transition-all z-30">
          
          {/* Vendor Operating Schedule Banner */}
          {(visitDays || visitTimings) && (
            <div className="mb-3 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-1 text-xs">
              {visitDays && (
                <div className="flex items-start gap-1.5 text-emerald-900 font-bold">
                  <span>📅 Open Days:</span>
                  <span className="text-emerald-700 font-extrabold">{visitDays}</span>
                </div>
              )}
              {visitTimings && (
                <div className="flex items-start gap-1.5 text-emerald-900 font-bold">
                  <span>🕐 Timings:</span>
                  <span className="text-teal-700 font-extrabold">{visitTimings}</span>
                </div>
              )}
              {allowedDays && allowedDays.length > 0 && (
                <p className="text-[10px] text-slate-400 font-medium italic pt-0.5">
                  * Calendar disables dates when farm is closed.
                </p>
              )}
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setPreset(1)}
              className="px-2.5 py-1 text-[11px] font-extrabold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors whitespace-nowrap border border-emerald-200/60"
            >
              ⚡ Next Open Day
            </button>
            <button
              type="button"
              onClick={setSaturdayPreset}
              className="px-2.5 py-1 text-[11px] font-extrabold bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-lg transition-colors whitespace-nowrap border border-teal-200/60"
            >
              🗓️ Saturday
            </button>
            <button
              type="button"
              onClick={() => setPreset(7)}
              className="px-2.5 py-1 text-[11px] font-extrabold bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-lg transition-colors whitespace-nowrap border border-amber-200/60"
            >
              🌟 In 7 Days
            </button>
          </div>

          {/* Month Header Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-xs font-black text-slate-800 tracking-tight">
              {monthNames[month]} {year}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((day, idx) => {
              const isAllowedDay = !allowedDays || allowedDays.includes(idx);
              return (
                <div
                  key={idx}
                  className={`text-[10px] font-extrabold uppercase py-1 ${
                    isAllowedDay ? 'text-emerald-700 font-black' : 'text-slate-300'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots before first day of month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const disabled = isDisabled(dayNum);
              const selected = isSelected(dayNum);
              const todayFlag = isToday(dayNum);

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDate(dayNum)}
                  title={disabled ? 'Farm closed or past date' : 'Available for visit'}
                  className={`h-9 w-9 mx-auto flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative ${
                    selected
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30 scale-105 z-10'
                      : disabled
                      ? 'bg-slate-100/50 text-slate-300 cursor-not-allowed line-through opacity-40'
                      : todayFlag
                      ? 'text-emerald-700 bg-emerald-50 border-2 border-emerald-500 hover:bg-emerald-100'
                      : 'text-slate-700 bg-white border border-slate-100 hover:bg-emerald-50 hover:text-emerald-700 shadow-xs'
                  }`}
                >
                  <span>{dayNum}</span>
                  {todayFlag && !selected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer date info */}
          {value && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <Check size={13} /> Date Selected
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-extrabold text-emerald-600 hover:underline"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
