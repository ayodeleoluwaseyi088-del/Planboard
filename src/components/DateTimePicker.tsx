import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  formatToIso, 
  formatHumanTime,
  formatDecisionDeadline,
  getDecisionCountdown
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
  deciderType?: string;
  onChange: (val: DateTimePickerValue) => void;
  onClear?: () => void;
  allowClear?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getOrdinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const formatOrdinalDate = (year: number, month: number, day: number) => {
  return `${MONTH_NAMES[month]} ${getOrdinal(day)} ${year}`;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  id = 'date-time-picker',
  initialIso,
  initialDate,
  initialTime,
  initialHasSpecificTime = true,
  deciderType = 'voting',
  onChange,
}) => {
  const [now, setNow] = useState(() => new Date());

  // Keep a 1-second ticking timer for real-time countdown preview
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parse initial state or fallback to a valid future time (2 hours from now)
  const initialResolvedDate = useMemo(() => {
    const currentNow = new Date();
    if (initialIso) {
      const d = new Date(initialIso);
      if (!isNaN(d.getTime()) && d.getTime() > currentNow.getTime()) {
        return d;
      }
    }
    // Default to 2 hours from now, rounded up to next 15-minute slot
    const future = new Date(currentNow.getTime() + 2 * 60 * 60 * 1000);
    const m = future.getMinutes();
    const roundedM = m === 0 ? 0 : m <= 15 ? 15 : m <= 30 ? 30 : m <= 45 ? 45 : 0;
    if (roundedM === 0 && m > 45) future.setHours(future.getHours() + 1);
    future.setMinutes(roundedM);
    future.setSeconds(0);
    future.setMilliseconds(0);
    return future;
  }, [initialIso]);

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

  // Calendar month navigation
  const [viewYear, setViewYear] = useState(selectedYear);
  const [viewMonth, setViewMonth] = useState(selectedMonth);

  const isTodaySelected = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() && selectedDay === now.getDate();

  const isDateInPast = (y: number, m: number, d: number) => {
    const cellDate = new Date(y, m, d);
    return cellDate < todayStart;
  };

  const isHourDisabled = (h: number, ampm: 'AM' | 'PM') => {
    if (!isTodaySelected) return false;
    let h24 = h % 12;
    if (ampm === 'PM') h24 += 12;
    const latestSlotInHour = new Date(selectedYear, selectedMonth, selectedDay, h24, 45, 0);
    return latestSlotInHour <= now;
  };

  const isMinuteDisabled = (mins: number) => {
    if (!isTodaySelected) return false;
    let h24 = selectedHour12 % 12;
    if (selectedAmPm === 'PM') h24 += 12;
    const slotTime = new Date(selectedYear, selectedMonth, selectedDay, h24, mins, 0);
    return slotTime <= now;
  };

  const isAmDisabled = isTodaySelected && now.getHours() >= 12;
  const isPmDisabled = isTodaySelected && now.getHours() === 23 && now.getMinutes() >= 45;

  // Compute selected Date object
  const currentSelectedDate = useMemo(() => {
    let h24 = selectedHour12 % 12;
    if (selectedAmPm === 'PM') h24 += 12;
    return new Date(selectedYear, selectedMonth, selectedDay, h24, selectedMinute, 0);
  }, [selectedYear, selectedMonth, selectedDay, selectedHour12, selectedMinute, selectedAmPm]);

  const countdown = useMemo(() => {
    return getDecisionCountdown(currentSelectedDate, now.getTime());
  }, [currentSelectedDate, now]);

  // Trigger parent change whenever internal structured values change
  const emitChange = (
    y: number,
    m: number,
    d: number,
    h12: number,
    mins: number,
    ampm: 'AM' | 'PM'
  ) => {
    let h24 = h12 % 12;
    if (ampm === 'PM') h24 += 12;
    const dateObj = new Date(y, m, d, h24, mins, 0);
    const iso = formatToIso(dateObj, true);
    const formattedDate = formatOrdinalDate(y, m, d);
    const formattedTime = formatHumanTime(dateObj);
    const deadlinePhrase = formatDecisionDeadline(dateObj, deciderType);

    onChange({
      iso,
      date: formattedDate,
      time: formattedTime,
      hasSpecificTime: true,
      rawText: deadlinePhrase,
    });
  };

  // Switch Month in Calendar
  const isPrevMonthDisabled = viewYear < now.getFullYear() || (viewYear === now.getFullYear() && viewMonth <= now.getMonth());

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
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

    // Append leading days of next month to complete standard grid
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
    if (isDateInPast(y, m, day)) return;

    setSelectedDay(day);
    setSelectedMonth(m);
    setSelectedYear(y);
    setViewMonth(m);
    setViewYear(y);

    let nextH = selectedHour12;
    let nextMin = selectedMinute;
    let nextAmPm = selectedAmPm;

    // If selecting today, ensure selected time is not in the past
    const isTargetToday = y === now.getFullYear() && m === now.getMonth() && day === now.getDate();
    if (isTargetToday) {
      let h24 = nextH % 12;
      if (nextAmPm === 'PM') h24 += 12;
      const testTime = new Date(y, m, day, h24, nextMin, 0);

      if (testTime <= now) {
        // Adjust to future time (2 hours from now)
        const future = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const fH24 = future.getHours();
        nextAmPm = fH24 >= 12 ? 'PM' : 'AM';
        nextH = fH24 % 12 === 0 ? 12 : fH24 % 12;
        const fm = future.getMinutes();
        nextMin = fm === 0 ? 0 : fm <= 15 ? 15 : fm <= 30 ? 30 : fm <= 45 ? 45 : 0;
        setSelectedHour12(nextH);
        setSelectedMinute(nextMin);
        setSelectedAmPm(nextAmPm);
      }
    }

    emitChange(y, m, day, nextH, nextMin, nextAmPm);
  };

  // Handle Time Change
  const handleSelectHour = (h: number) => {
    if (isHourDisabled(h, selectedAmPm)) return;
    setSelectedHour12(h);

    let nextMin = selectedMinute;
    if (isTodaySelected) {
      let h24 = h % 12;
      if (selectedAmPm === 'PM') h24 += 12;
      if (new Date(selectedYear, selectedMonth, selectedDay, h24, nextMin, 0) <= now) {
        // Find next valid minute
        const validMinute = [0, 15, 30, 45].find(
          (m) => new Date(selectedYear, selectedMonth, selectedDay, h24, m, 0) > now
        );
        if (validMinute !== undefined) {
          nextMin = validMinute;
          setSelectedMinute(nextMin);
        }
      }
    }

    emitChange(selectedYear, selectedMonth, selectedDay, h, nextMin, selectedAmPm);
  };

  const handleSelectMinute = (m: number) => {
    if (isMinuteDisabled(m)) return;
    setSelectedMinute(m);
    emitChange(selectedYear, selectedMonth, selectedDay, selectedHour12, m, selectedAmPm);
  };

  const handleToggleAmPm = (val: 'AM' | 'PM') => {
    if (val === 'AM' && isAmDisabled) return;
    if (val === 'PM' && isPmDisabled) return;
    setSelectedAmPm(val);

    let nextHour = selectedHour12;
    let nextMinute = selectedMinute;
    if (isTodaySelected) {
      let h24 = nextHour % 12;
      if (val === 'PM') h24 += 12;
      if (new Date(selectedYear, selectedMonth, selectedDay, h24, nextMinute, 0) <= now) {
        // Adjust hour forward if current hour is past in this new meridiem
        for (let testH = 1; testH <= 12; testH++) {
          if (!isHourDisabled(testH, val)) {
            nextHour = testH;
            setSelectedHour12(nextHour);
            break;
          }
        }
      }
    }

    emitChange(selectedYear, selectedMonth, selectedDay, nextHour, nextMinute, val);
  };

  // Handle Relative Preset Selection
  const handleApplyPreset = (type: 'in2hours' | 'today7pm' | 'tomorrow' | 'thisSaturday') => {
    const currentNow = new Date();
    let target = new Date();

    if (type === 'in2hours') {
      target = new Date(currentNow.getTime() + 2 * 60 * 60 * 1000);
    } else if (type === 'today7pm') {
      if (currentNow.getHours() >= 19) {
        // If 7PM today has passed, roll to 7PM tomorrow
        target = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate() + 1, 19, 0, 0);
      } else {
        target = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate(), 19, 0, 0);
      }
    } else if (type === 'tomorrow') {
      target = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate() + 1, 19, 0, 0);
    } else if (type === 'thisSaturday') {
      const diff = (6 - currentNow.getDay() + 7) % 7 || 7;
      target = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate() + diff, 12, 0, 0);
    }

    const y = target.getFullYear();
    const m = target.getMonth();
    const d = target.getDate();
    const h24 = target.getHours();
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const mins = target.getMinutes();
    const roundedMins = mins === 0 || mins === 15 || mins === 30 || mins === 45 ? mins : 0;

    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
    setViewYear(y);
    setViewMonth(m);
    setSelectedHour12(h12);
    setSelectedMinute(roundedMins);
    setSelectedAmPm(ampm);

    emitChange(y, m, d, h12, roundedMins, ampm);
  };

  const isSelectedDate = (day: number, m: number, y: number) => {
    return day === selectedDay && m === selectedMonth && y === selectedYear;
  };

  return (
    <div id={id} className="space-y-4">
      {/* Quick Relative Presets Row */}
      <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 no-scrollbar">
        {[
          { label: 'In 2 hours', type: 'in2hours' as const },
          { label: now.getHours() >= 19 ? 'Tomorrow 7PM' : 'Today 7PM', type: 'today7pm' as const },
          { label: 'Tomorrow 7PM', type: 'tomorrow' as const },
          { label: 'Saturday 12PM', type: 'thisSaturday' as const },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleApplyPreset(preset.type)}
            className="px-5 py-2.5 rounded-full border border-[#ECEFF3] bg-white text-sm font-semibold text-[#555A68] hover:text-[#1A1B25] hover:border-[#C1C7CF] transition whitespace-nowrap cursor-pointer shadow-2xs active:scale-95"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Visual Pickers Grid (Calendar + Time) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Left Card: Calendar Picker */}
        <div className="rounded-3xl border border-[#ECEFF3] p-5 sm:p-6 bg-white flex flex-col justify-between shadow-2xs">
          <div>
            {/* Month Header Navigation */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-[#1A1B25]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={isPrevMonthDisabled}
                  className="p-1 rounded-lg text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 text-center mb-3">
              {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((wd) => (
                <span key={wd} className="text-xs font-semibold text-[#808897]">
                  {wd}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-3.5 text-center items-center">
              {calendarDays.map((cell, idx) => {
                const selected = isSelectedDate(cell.day, cell.month, cell.year);
                const isPast = isDateInPast(cell.year, cell.month, cell.day);

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelectDay(cell.day, cell.month, cell.year)}
                    className={`flex items-center justify-center transition select-none h-8 w-8 mx-auto ${
                      isPast ? 'opacity-25 cursor-not-allowed pointer-events-none line-through' : 'cursor-pointer'
                    }`}
                  >
                    {selected ? (
                      <span className="w-8 h-8 rounded-full bg-[#EAA21F] text-white font-bold text-sm flex items-center justify-center mx-auto shadow-xs">
                        {cell.day}
                      </span>
                    ) : cell.isCurrentMonth ? (
                      <span className="text-sm font-bold text-[#1A1B25] hover:text-[#EAA21F]">
                        {cell.day}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-[#A4ABB8] hover:text-[#666D80]">
                        {cell.day}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Card: Time Picker */}
        <div className="rounded-3xl border border-[#ECEFF3] p-5 sm:p-6 bg-white flex flex-col justify-between shadow-2xs">
          <div>
            {/* Header: Select Time with AM / PM toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-[#1A1B25]">
                Select Time
              </span>
              <div className="flex items-center bg-[#F4F6F8] p-0.5 rounded-full">
                <button
                  type="button"
                  disabled={isAmDisabled}
                  onClick={() => handleToggleAmPm('AM')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    isAmDisabled
                      ? 'opacity-25 cursor-not-allowed pointer-events-none text-[#A4ABB8]'
                      : 'cursor-pointer'
                  } ${
                    selectedAmPm === 'AM'
                      ? 'bg-[#ECEFF3] text-[#1A1B25]'
                      : 'text-[#808897] hover:text-[#1A1B25]'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  disabled={isPmDisabled}
                  onClick={() => handleToggleAmPm('PM')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    isPmDisabled
                      ? 'opacity-25 cursor-not-allowed pointer-events-none text-[#A4ABB8]'
                      : 'cursor-pointer'
                  } ${
                    selectedAmPm === 'PM'
                      ? 'bg-[#ECEFF3] text-[#1A1B25]'
                      : 'text-[#808897] hover:text-[#1A1B25]'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Hours Section */}
            <div className="mb-4">
              <span className="block text-xs sm:text-sm font-semibold text-[#808897] mb-3">
                Hours
              </span>
              <div className="grid grid-cols-7 gap-y-3.5 text-center items-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                  const isSelected = selectedHour12 === h;
                  const isHourPast = isHourDisabled(h, selectedAmPm);

                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={isHourPast}
                      onClick={() => handleSelectHour(h)}
                      className={`flex items-center justify-center transition select-none h-8 w-8 mx-auto ${
                        isHourPast ? 'opacity-25 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                      }`}
                    >
                      {isSelected ? (
                        <span className="w-8 h-8 rounded-full bg-[#EAA21F] text-white font-bold text-sm flex items-center justify-center mx-auto shadow-xs">
                          {h}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-[#1A1B25] hover:text-[#EAA21F]">
                          {h}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Section */}
            <div className="mt-5">
              <span className="block text-xs sm:text-sm font-semibold text-[#808897] mb-3">
                Minutes
              </span>
              <div className="flex items-center gap-4">
                {[
                  { label: ':00', val: 0 },
                  { label: ':15', val: 15 },
                  { label: ':30', val: 30 },
                  { label: ':45', val: 45 },
                ].map((min) => {
                  const isSelected = selectedMinute === min.val;
                  const isMinPast = isMinuteDisabled(min.val);

                  return (
                    <button
                      key={min.label}
                      type="button"
                      disabled={isMinPast}
                      onClick={() => handleSelectMinute(min.val)}
                      className={`flex items-center justify-center transition select-none ${
                        isMinPast ? 'opacity-25 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                      }`}
                    >
                      {isSelected ? (
                        <span className="w-9 h-9 rounded-full bg-[#EAA21F] text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                          {min.label}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-[#1A1B25] hover:text-[#EAA21F] px-1 py-1">
                          {min.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Card - Decision Deadline Preview */}
      <div className="rounded-2xl p-4 sm:p-5 bg-[#FFF9EE] border border-[#FDE68A] mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <span className="text-[11px] font-bold text-[#CA7A18] uppercase tracking-wider block mb-1">
            Decision Deadline
          </span>
          <span className="text-base sm:text-lg font-black text-[#1A1B25] block leading-tight">
            {formatDecisionDeadline(currentSelectedDate, deciderType)}
          </span>
          <p className="text-xs text-[#808897] mt-1 font-medium">
            This represents the cutoff for this specific decision. Participation closes automatically at this time.
          </p>
        </div>

        {countdown && !countdown.isExpired && (
          <div className="shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xs ${
              countdown.isImminent ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-amber-100 text-amber-900'
            }`}>
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>{countdown.label}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
