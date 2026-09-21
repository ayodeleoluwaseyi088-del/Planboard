import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  X, 
  Flame, 
  AlertCircle,
  Timer
} from 'lucide-react';
import { 
  formatToIso, 
  formatHumanDate, 
  formatHumanTime, 
  buildStructuredDateTime, 
  parseDateTimeInput, 
  useLiveCountdown,
  StructuredDateTimeResult
} from '../utils/dateTime';

export interface DateTimePickerValue {
  iso: string;
  date: string;
  time: string;
  hasSpecificTime: boolean;
  rawText?: string;
}

interface DateTimePickerProps {
  id?: string;
  initialIso?: string;
  initialDate?: string;
  initialTime?: string;
  initialHasSpecificTime?: boolean;
  onChange: (val: DateTimePickerValue) => void;
  onClear?: () => void;
  allowClear?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  id = 'date-time-picker',
  initialIso,
  initialDate,
  initialTime,
  initialHasSpecificTime = true,
  onChange,
  onClear,
  allowClear = true,
}) => {
  // Modes: 'datetime' | 'date' | 'time'
  const [mode, setMode] = useState<'datetime' | 'date' | 'time'>(
    initialHasSpecificTime === false ? 'date' : 'datetime'
  );

  // Parse initial state or fallback to sensible date (e.g. today or from initialIso / initialDate)
  const initialResolvedDate = useMemo(() => {
    if (initialIso) {
      const d = new Date(initialIso);
      if (!isNaN(d.getTime())) return d;
    }
    if (initialDate) {
      const parsed = parseDateTimeInput(`${initialDate} ${initialTime || ''}`);
      if (parsed.structured) {
        const d = new Date(parsed.structured.iso);
        if (!isNaN(d.getTime())) return d;
      }
    }
    // Default to current date (2026)
    return new Date();
  }, [initialIso, initialDate, initialTime]);

  const [selectedYear, setSelectedYear] = useState(initialResolvedDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialResolvedDate.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState(initialResolvedDate.getDate());
  
  // 12-hour time state
  const initHour24 = initialResolvedDate.getHours();
  const initAmPm = initHour24 >= 12 ? 'PM' : 'AM';
  const initHour12 = initHour24 % 12 === 0 ? 12 : initHour24 % 12;

  const [selectedHour12, setSelectedHour12] = useState<number>(initHour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(
    initialResolvedDate.getMinutes() > 0 ? initialResolvedDate.getMinutes() : 0
  );
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(initAmPm);

  // Free-text / relative input
  const [naturalInput, setNaturalInput] = useState<string>(
    initialDate ? `${initialDate}${initialTime ? ` at ${initialTime}` : ''}` : ''
  );
  const [interpretationFeedback, setInterpretationFeedback] = useState<{
    recognized: boolean;
    label?: string;
    iso?: string;
  } | null>(null);

  // Calendar month navigation
  const [viewYear, setViewYear] = useState(selectedYear);
  const [viewMonth, setViewMonth] = useState(selectedMonth);

  // Active ISO calculation
  const currentIso = useMemo(() => {
    let h = selectedHour12 % 12;
    if (selectedAmPm === 'PM') h += 12;
    const d = new Date(selectedYear, selectedMonth, selectedDay, h, selectedMinute, 0);
    return formatToIso(d, mode !== 'date');
  }, [selectedYear, selectedMonth, selectedDay, selectedHour12, selectedMinute, selectedAmPm, mode]);

  // Live countdown that ticks automatically without page refresh!
  const countdown = useLiveCountdown(currentIso, mode !== 'date');

  // Trigger parent change whenever internal structured values change
  const emitChange = (
    y: number,
    m: number,
    d: number,
    h12: number,
    mins: number,
    ampm: 'AM' | 'PM',
    targetMode: 'datetime' | 'date' | 'time',
    rawTextStr?: string
  ) => {
    let h24 = h12 % 12;
    if (ampm === 'PM') h24 += 12;
    const dateObj = new Date(y, m, d, h24, mins, 0);
    const hasTime = targetMode !== 'date';
    const iso = formatToIso(dateObj, hasTime);
    const formattedDate = formatHumanDate(dateObj);
    const formattedTime = formatHumanTime(dateObj);

    onChange({
      iso,
      date: formattedDate,
      time: hasTime ? formattedTime : '',
      hasSpecificTime: hasTime,
      rawText: rawTextStr,
    });
  };

  // Switch Month in Calendar
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate calendar days for viewMonth / viewYear
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; month: number; year: number }[] = [];

    // Prepend trailing days of previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        month: viewMonth === 0 ? 11 : viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
      });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        month: viewMonth,
        year: viewYear,
      });
    }

    // Append leading days of next month to complete 42 or 35 grid cells
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          month: viewMonth === 11 ? 0 : viewMonth + 1,
          year: viewMonth === 11 ? viewYear + 1 : viewYear,
        });
      }
    }

    return days;
  }, [viewYear, viewMonth]);

  // Handle Day Select
  const handleSelectDay = (day: number, m: number, y: number) => {
    setSelectedDay(day);
    setSelectedMonth(m);
    setSelectedYear(y);
    setViewMonth(m);
    setViewYear(y);

    emitChange(y, m, day, selectedHour12, selectedMinute, selectedAmPm, mode);
  };

  // Handle Time Change
  const handleSelectHour = (h: number) => {
    setSelectedHour12(h);
    emitChange(selectedYear, selectedMonth, selectedDay, h, selectedMinute, selectedAmPm, mode);
  };

  const handleSelectMinute = (m: number) => {
    setSelectedMinute(m);
    emitChange(selectedYear, selectedMonth, selectedDay, selectedHour12, m, selectedAmPm, mode);
  };

  const handleToggleAmPm = (val: 'AM' | 'PM') => {
    setSelectedAmPm(val);
    emitChange(selectedYear, selectedMonth, selectedDay, selectedHour12, selectedMinute, val, mode);
  };

  // Mode change
  const handleModeChange = (newMode: 'datetime' | 'date' | 'time') => {
    setMode(newMode);
    emitChange(selectedYear, selectedMonth, selectedDay, selectedHour12, selectedMinute, selectedAmPm, newMode);
  };

  // Handle Natural / Relative text input
  const handleNaturalInputChange = (text: string) => {
    setNaturalInput(text);
    if (!text.trim()) {
      setInterpretationFeedback(null);
      return;
    }

    const parsed = parseDateTimeInput(text);
    if (parsed.isConfidenceHigh && parsed.structured) {
      const s = parsed.structured;
      const h12 = s.hours % 12 === 0 ? 12 : s.hours % 12;
      const ampm = s.hours >= 12 ? 'PM' : 'AM';

      setSelectedYear(s.year);
      setSelectedMonth(s.month);
      setSelectedDay(s.day);
      setViewYear(s.year);
      setViewMonth(s.month);
      setSelectedHour12(h12);
      setSelectedMinute(s.minutes);
      setSelectedAmPm(ampm);
      setMode(s.hasSpecificTime ? 'datetime' : 'date');

      setInterpretationFeedback({
        recognized: true,
        label: s.displayString,
        iso: s.iso,
      });

      emitChange(s.year, s.month, s.day, h12, s.minutes, ampm, s.hasSpecificTime ? 'datetime' : 'date', text);
    } else {
      // Free text that cannot be confidently parsed - keep as raw text
      setInterpretationFeedback({
        recognized: false,
        label: `"${text}" (stored as text)`,
      });
      // Notify parent of raw text without guessing
      onChange({
        iso: currentIso,
        date: text,
        time: '',
        hasSpecificTime: false,
        rawText: text,
      });
    }
  };

  // Quick Preset Handlers
  const handleApplyPreset = (type: 'in2hours' | 'today7pm' | 'tomorrow' | 'thisSaturday' | 'in3days') => {
    const now = new Date();
    let target = new Date();
    let targetMode: 'datetime' | 'date' | 'time' = 'datetime';

    if (type === 'in2hours') {
      target = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      targetMode = 'datetime';
    } else if (type === 'today7pm') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
      targetMode = 'datetime';
    } else if (type === 'tomorrow') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0, 0);
      targetMode = 'datetime';
    } else if (type === 'thisSaturday') {
      const diff = (6 - now.getDay() + 7) % 7 || 7;
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 14, 0, 0);
      targetMode = 'datetime';
    } else if (type === 'in3days') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12, 0, 0);
      targetMode = 'datetime';
    }

    const y = target.getFullYear();
    const m = target.getMonth();
    const d = target.getDate();
    const h24 = target.getHours();
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const mins = target.getMinutes();

    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
    setViewYear(y);
    setViewMonth(m);
    setSelectedHour12(h12);
    setSelectedMinute(mins);
    setSelectedAmPm(ampm);
    setMode(targetMode);

    const formatted = `${formatHumanDate(target)} · ${formatHumanTime(target)}`;
    setNaturalInput(formatted);
    setInterpretationFeedback({
      recognized: true,
      label: formatted,
      iso: formatToIso(target, true),
    });

    emitChange(y, m, d, h12, mins, ampm, targetMode);
  };

  const isSelectedDate = (day: number, m: number, y: number) => {
    return day === selectedDay && m === selectedMonth && y === selectedYear;
  };

  const isTodayDate = (day: number, m: number, y: number) => {
    const today = new Date();
    return day === today.getDate() && m === today.getMonth() && y === today.getFullYear();
  };

  return (
    <div id={id} className="space-y-3 bg-[#F8F9FB] p-3.5 sm:p-4 rounded-2xl">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center bg-[#ECEFF3] p-0.5 rounded-xl text-xs font-black">
          <button
            type="button"
            onClick={() => handleModeChange('datetime')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'datetime'
                ? 'bg-white text-[#1A1B25] shadow-xs'
                : 'text-[#666D80] hover:text-[#1A1B25]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Date & Time</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('date')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'date'
                ? 'bg-white text-[#1A1B25] shadow-xs'
                : 'text-[#666D80] hover:text-[#1A1B25]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Date Only</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('time')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'time'
                ? 'bg-white text-[#1A1B25] shadow-xs'
                : 'text-[#666D80] hover:text-[#1A1B25]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time Only</span>
          </button>
        </div>

        {allowClear && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-extrabold text-[#808897] hover:text-rose-600 transition flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50"
          >
            <X className="w-3 h-3" />
            <span>Clear schedule</span>
          </button>
        )}
      </div>

      {/* Quick Relative Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#808897] shrink-0">
          Quick:
        </span>
        <button
          type="button"
          onClick={() => handleApplyPreset('in2hours')}
          className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#ECEFF3] text-[11px] font-extrabold text-[#272835] transition shrink-0 cursor-pointer active:scale-95"
        >
          ⚡ in 2 hours
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('today7pm')}
          className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#ECEFF3] text-[11px] font-extrabold text-[#272835] transition shrink-0 cursor-pointer active:scale-95"
        >
          Today 7:00 PM
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('tomorrow')}
          className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#ECEFF3] text-[11px] font-extrabold text-[#272835] transition shrink-0 cursor-pointer active:scale-95"
        >
          Tomorrow 2:00 PM
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('thisSaturday')}
          className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#ECEFF3] text-[11px] font-extrabold text-[#272835] transition shrink-0 cursor-pointer active:scale-95"
        >
          Saturday
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('in3days')}
          className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#ECEFF3] text-[11px] font-extrabold text-[#272835] transition shrink-0 cursor-pointer active:scale-95"
        >
          in 3 days
        </button>
      </div>

      {/* Smart Relative Input Field */}
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Type date/time naturally: e.g. in 2 hours, tomorrow at 7pm, August 20, 2026..."
            value={naturalInput}
            onChange={(e) => handleNaturalInputChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white font-medium text-[#1A1B25] outline-none shadow-2xs"
          />
          <Sparkles className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-3 pointer-events-none" />
        </div>

        {/* Live Interpretation Badge */}
        {interpretationFeedback && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            {interpretationFeedback.recognized ? (
              <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Recognized: {interpretationFeedback.label}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#666D80] font-medium bg-[#ECEFF3] px-2 py-0.5 rounded-lg">
                <AlertCircle className="w-3 h-3" />
                <span>Preserved as text: {interpretationFeedback.label}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Visual Pickers Grid (Calendar + Time) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
        {/* Calendar Picker (shown in datetime and date modes) */}
        {mode !== 'time' && (
          <div className={`${mode === 'date' ? 'md:col-span-12' : 'md:col-span-7'} bg-white p-3 rounded-2xl shadow-2xs`}>
            {/* Month Header Navigation */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-black text-[#1A1B25]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-[#F6F8FA] text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-[#F6F8FA] text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="text-[10px] font-black uppercase text-[#808897] py-0.5">
                  {wd}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((cell, idx) => {
                const selected = isSelectedDate(cell.day, cell.month, cell.year);
                const isToday = isTodayDate(cell.day, cell.month, cell.year);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell.day, cell.month, cell.year)}
                    className={`h-7 w-full rounded-xl text-xs font-bold transition flex items-center justify-center relative cursor-pointer ${
                      selected
                        ? 'bg-[#1A1B25] text-white font-black shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-[#1A1B25] hover:bg-amber-100/70'
                        : 'text-[#C1C7CF] hover:bg-[#F6F8FA]'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {isToday && !selected && (
                      <span className="w-1 h-1 bg-amber-500 rounded-full absolute bottom-0.5 left-1/2 -translate-x-1/2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Time Picker (shown in datetime and time modes) */}
        {mode !== 'date' && (
          <div className={`${mode === 'time' ? 'md:col-span-12' : 'md:col-span-5'} bg-white p-3 rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#1A1B25] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Select Time</span>
                </span>
                {/* AM / PM Toggle */}
                <div className="flex items-center bg-[#ECEFF3] p-0.5 rounded-lg text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => handleToggleAmPm('AM')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      selectedAmPm === 'AM' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-[#666D80]'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAmPm('PM')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      selectedAmPm === 'PM' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-[#666D80]'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Hour Selection (1-12) */}
              <div className="mb-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#808897] mb-1">
                  Hour
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={`py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                        selectedHour12 === h
                          ? 'bg-[#1A1B25] text-white font-black shadow-xs'
                          : 'bg-[#F8F9FB] text-[#272835] hover:bg-[#ECEFF3]'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minute Selection (00, 15, 30, 45 or custom) */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#808897] mb-1">
                  Minute
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 15, 30, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                        selectedMinute === m
                          ? 'bg-[#1A1B25] text-white font-black shadow-xs'
                          : 'bg-[#F8F9FB] text-[#272835] hover:bg-[#ECEFF3]'
                      }`}
                    >
                      :{String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Chosen Time Display */}
            <div className="p-2 rounded-xl bg-[#F8F9FB] flex items-center justify-between text-xs">
              <span className="text-[#808897] font-bold">Selected:</span>
              <span className="font-black text-[#1A1B25]">
                {String(selectedHour12).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} {selectedAmPm}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Machine-Readable Value & Real-Time Countdown Preview Banner */}
      <div className="p-3 bg-white rounded-2xl shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Formatted Human Display */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-[#1A1B25]">
                {mode === 'time'
                  ? `${String(selectedHour12).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`
                  : mode === 'date'
                  ? formatHumanDate(new Date(selectedYear, selectedMonth, selectedDay))
                  : `${formatHumanDate(new Date(selectedYear, selectedMonth, selectedDay))} at ${String(selectedHour12).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`}
              </div>
              <div className="text-[10px] text-[#808897] font-mono">
                Stored ISO: {currentIso}
              </div>
            </div>
          </div>

          {/* Dynamic Countdown Pill */}
          {countdown.label && (
            <div className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
              countdown.status === 'started'
                ? 'bg-emerald-100 text-emerald-900'
                : countdown.status === 'imminent'
                ? 'bg-rose-100 text-rose-900 animate-pulse'
                : countdown.status === 'passed'
                ? 'bg-[#ECEFF3] text-[#666D80]'
                : 'bg-amber-100 text-amber-900'
            }`}>
              {countdown.status === 'started' && <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />}
              {countdown.status === 'imminent' && <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />}
              {countdown.status === 'future' && <Clock className="w-3.5 h-3.5 text-amber-700" />}
              <span>{countdown.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
