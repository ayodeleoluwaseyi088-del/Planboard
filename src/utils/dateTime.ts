import { useState, useEffect } from 'react';

export interface StructuredDateTimeResult {
  iso: string; // ISO 8601 machine-readable timestamp, e.g. "2026-08-20T19:00:00"
  formattedDate: string; // e.g. "August 20, 2026"
  formattedTime: string; // e.g. "07:00 PM"
  displayString: string; // e.g. "August 20, 2026 · 07:00 PM"
  hasSpecificTime: boolean;
  year: number;
  month: number; // 0-11
  day: number; // 1-31
  hours: number; // 0-23
  minutes: number; // 0-59
  rawText?: string;
  isConfidenceHigh: boolean;
}

export type CountdownStatus = 'future' | 'imminent' | 'started' | 'passed';

export interface CountdownInfo {
  status: CountdownStatus;
  label: string;
  shortLabel: string;
  isFuture: boolean;
  isPassed: boolean;
  isPast: boolean;
  isImminent: boolean;
  isValid: boolean;
  diffMinutes: number;
  diffDays: number;
  diffHours: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Formats a Date object into standard "YYYY-MM-DDTHH:mm:ss" without timezone shift
 */
export function formatToIso(date: Date, includeTime = true): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (!includeTime) {
    return `${y}-${m}-${d}T00:00:00`;
  }
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

/**
 * Formats a Date object into human-readable date, e.g. "August 20, 2026"
 */
export function formatHumanDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Formats a Date object into 12-hour human time, e.g. "07:00 PM"
 */
export function formatHumanTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = String(hours).padStart(2, '0');
  const strMinutes = String(minutes).padStart(2, '0');
  return `${strHours}:${strMinutes} ${ampm}`;
}

/**
 * Build a structured object from explicit year, month, day, hours, minutes
 */
export function buildStructuredDateTime(
  year: number,
  month: number,
  day: number,
  hours = 12,
  minutes = 0,
  hasSpecificTime = true,
  rawText?: string
): StructuredDateTimeResult {
  const d = new Date(year, month, day, hours, minutes, 0);
  const formattedDate = formatHumanDate(d);
  const formattedTime = formatHumanTime(d);
  const iso = formatToIso(d, hasSpecificTime);
  const displayString = hasSpecificTime ? `${formattedDate} · ${formattedTime}` : formattedDate;

  return {
    iso,
    formattedDate,
    formattedTime,
    displayString,
    hasSpecificTime,
    year,
    month,
    day,
    hours,
    minutes,
    rawText,
    isConfidenceHigh: true,
  };
}

/**
 * Parses free text, natural language, or relative date/time inputs.
 * E.g.
 * - "in 2 hours"
 * - "in 45 minutes"
 * - "tomorrow at 7:00 PM"
 * - "in 3 days"
 * - "August 20, 2026 at 7:00 PM"
 * - "next Friday at 6pm"
 * If confidence is low, sets isConfidenceHigh: false so caller keeps it as text.
 */
export function parseDateTimeInput(input: string, baseNow = new Date()): {
  structured?: StructuredDateTimeResult;
  isConfidenceHigh: boolean;
  rawText: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isConfidenceHigh: false, rawText: input };
  }

  const lower = trimmed.toLowerCase();

  // 1. Relative: "in X hours" or "in X hrs" or "in X hr" or "in X h"
  const inHoursMatch = lower.match(/^in\s+(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)$/);
  if (inHoursMatch) {
    const hoursToAdd = parseFloat(inHoursMatch[1]);
    const target = new Date(baseNow.getTime() + hoursToAdd * 60 * 60 * 1000);
    return {
      structured: buildStructuredDateTime(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        target.getHours(),
        target.getMinutes(),
        true,
        trimmed
      ),
      isConfidenceHigh: true,
      rawText: trimmed,
    };
  }

  // 2. Relative: "in X minutes" or "in X mins" or "in X min" or "in X m"
  const inMinutesMatch = lower.match(/^in\s+(\d+)\s*(?:minutes|minute|mins|min|m)$/);
  if (inMinutesMatch) {
    const minsToAdd = parseInt(inMinutesMatch[1], 10);
    const target = new Date(baseNow.getTime() + minsToAdd * 60 * 1000);
    return {
      structured: buildStructuredDateTime(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        target.getHours(),
        target.getMinutes(),
        true,
        trimmed
      ),
      isConfidenceHigh: true,
      rawText: trimmed,
    };
  }

  // 3. Relative: "in X days" or "in X day"
  const inDaysMatch = lower.match(/^in\s+(\d+)\s*(?:days|day)$/);
  if (inDaysMatch) {
    const daysToAdd = parseInt(inDaysMatch[1], 10);
    const target = new Date(baseNow);
    target.setDate(target.getDate() + daysToAdd);
    // Keep current time or set to reasonable default (e.g. 12:00 PM)
    return {
      structured: buildStructuredDateTime(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        baseNow.getHours(),
        baseNow.getMinutes(),
        true,
        trimmed
      ),
      isConfidenceHigh: true,
      rawText: trimmed,
    };
  }

  // 4. Relative: "in X weeks" or "in X week"
  const inWeeksMatch = lower.match(/^in\s+(\d+)\s*(?:weeks|week)$/);
  if (inWeeksMatch) {
    const weeksToAdd = parseInt(inWeeksMatch[1], 10);
    const target = new Date(baseNow);
    target.setDate(target.getDate() + weeksToAdd * 7);
    return {
      structured: buildStructuredDateTime(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        12,
        0,
        false,
        trimmed
      ),
      isConfidenceHigh: true,
      rawText: trimmed,
    };
  }

  // 5. "Tomorrow" or "Tomorrow at <time>"
  if (lower.startsWith('tomorrow')) {
    const target = new Date(baseNow);
    target.setDate(target.getDate() + 1);
    const restTime = lower.replace(/^tomorrow(\s+at)?/, '').trim();
    if (restTime) {
      const parsedTime = parseTimeSnippet(restTime);
      if (parsedTime) {
        return {
          structured: buildStructuredDateTime(
            target.getFullYear(),
            target.getMonth(),
            target.getDate(),
            parsedTime.hours,
            parsedTime.minutes,
            true,
            trimmed
          ),
          isConfidenceHigh: true,
          rawText: trimmed,
        };
      }
    }
    // Default tomorrow at 12:00 PM
    return {
      structured: buildStructuredDateTime(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        12,
        0,
        false,
        trimmed
      ),
      isConfidenceHigh: true,
      rawText: trimmed,
    };
  }

  // 6. "Today" or "Today at <time>"
  if (lower.startsWith('today')) {
    const target = new Date(baseNow);
    const restTime = lower.replace(/^today(\s+at)?/, '').trim();
    if (restTime) {
      const parsedTime = parseTimeSnippet(restTime);
      if (parsedTime) {
        return {
          structured: buildStructuredDateTime(
            target.getFullYear(),
            target.getMonth(),
            target.getDate(),
            parsedTime.hours,
            parsedTime.minutes,
            true,
            trimmed
          ),
          isConfidenceHigh: true,
          rawText: trimmed,
        };
      }
    }
    return {
      structured: buildStructuredDateTime(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        target.getHours(),
        target.getMinutes(),
        true,
        trimmed
      ),
      isConfidenceHigh: true,
      rawText: trimmed,
    };
  }

  // 7. Relative days of week: "this friday", "next saturday", "friday at 6pm"
  const dayMatch = lower.match(/^(this|next)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\s+at\s+(.+))?$/);
  if (dayMatch) {
    const modifier = dayMatch[1]; // 'this' or 'next'
    const dayName = dayMatch[2];
    const timeSnippet = dayMatch[3];
    const targetDayIndex = DAY_NAMES.findIndex((d) => d.toLowerCase() === dayName);

    if (targetDayIndex !== -1) {
      const target = new Date(baseNow);
      let diff = targetDayIndex - baseNow.getDay();
      if (modifier === 'next') {
        diff = diff <= 0 ? diff + 7 : diff + 7;
      } else {
        if (diff <= 0) diff += 7; // upcoming this week
      }
      target.setDate(target.getDate() + diff);

      let parsedHours = 12;
      let parsedMins = 0;
      let hasTime = false;

      if (timeSnippet) {
        const p = parseTimeSnippet(timeSnippet);
        if (p) {
          parsedHours = p.hours;
          parsedMins = p.minutes;
          hasTime = true;
        }
      }

      return {
        structured: buildStructuredDateTime(
          target.getFullYear(),
          target.getMonth(),
          target.getDate(),
          parsedHours,
          parsedMins,
          hasTime,
          trimmed
        ),
        isConfidenceHigh: true,
        rawText: trimmed,
      };
    }
  }

  // 8. Standard ISO String: "2026-08-20T19:00:00" or "2026-08-20"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const hh = isoMatch[4] ? parseInt(isoMatch[4], 10) : 12;
    const mm = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
    const hasTime = Boolean(isoMatch[4]);
    return {
      structured: buildStructuredDateTime(y, m, d, hh, mm, hasTime, trimmed),
      isConfidenceHigh: true,
      rawText: trimmed,
    };
  }

  // 9. Standard Full Date Strings: e.g. "August 20, 2026 at 7:00 PM" or "August 20, 2026 · 07:00 PM"
  // or "Saturday, August 22, 2026" or "Sept 19, 2026"
  const fullDateRegex = /(?:(sunday|monday|tuesday|wednesday|thursday|friday|saturday),?\s*)?([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?(?:\s*(?:at|·|,)\s*(.+))?/i;
  const fullMatch = trimmed.match(fullDateRegex);
  if (fullMatch) {
    const monthStr = fullMatch[2].toLowerCase();
    const monthIndex = MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthStr) !== -1
      ? MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthStr)
      : MONTH_ABBR.findIndex((m) => m.toLowerCase() === monthStr);

    if (monthIndex !== -1) {
      const day = parseInt(fullMatch[3], 10);
      const year = fullMatch[4] ? parseInt(fullMatch[4], 10) : baseNow.getFullYear();
      let hours = 12;
      let minutes = 0;
      let hasTime = false;

      if (fullMatch[5]) {
        const p = parseTimeSnippet(fullMatch[5].trim());
        if (p) {
          hours = p.hours;
          minutes = p.minutes;
          hasTime = true;
        }
      }

      return {
        structured: buildStructuredDateTime(year, monthIndex, day, hours, minutes, hasTime, trimmed),
        isConfidenceHigh: true,
        rawText: trimmed,
      };
    }
  }

  // 10. Time-only snippet: "7:00 PM", "19:00", "2:30pm"
  const timeOnly = parseTimeSnippet(trimmed);
  if (timeOnly) {
    return {
      structured: buildStructuredDateTime(
        baseNow.getFullYear(),
        baseNow.getMonth(),
        baseNow.getDate(),
        timeOnly.hours,
        timeOnly.minutes,
        true,
        trimmed
      ),
      isConfidenceHigh: true,
      rawText: trimmed,
    };
  }

  // 11. Native Date.parse fallback
  const nativeTimestamp = Date.parse(trimmed);
  if (!isNaN(nativeTimestamp)) {
    const d = new Date(nativeTimestamp);
    // Sanity check year between 2000 and 2100
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2100) {
      const hasTime = !trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
      return {
        structured: buildStructuredDateTime(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          d.getHours(),
          d.getMinutes(),
          hasTime,
          trimmed
        ),
        isConfidenceHigh: true,
        rawText: trimmed,
      };
    }
  }

  // If system cannot confidently interpret input, keep it as text rather than guessing
  return {
    isConfidenceHigh: false,
    rawText: input,
  };
}

/**
 * Helper to parse time strings like "7:00 PM", "7pm", "19:00", "02:30 pm"
 */
function parseTimeSnippet(str: string): { hours: number; minutes: number } | null {
  const clean = str.trim().toLowerCase();
  
  // 12-hour format: "7:00 pm", "07:30 am", "7pm", "7 am"
  const ampmMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3] === 'pm';
    if (h > 12) return null;
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return { hours: h, minutes: m };
  }

  // 24-hour format: "19:00", "07:30"
  const militaryMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const h = parseInt(militaryMatch[1], 10);
    const m = parseInt(militaryMatch[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return { hours: h, minutes: m };
    }
  }

  return null;
}

/**
 * Calculates countdown and progress state for a target ISO date/time string
 */
export function getCountdownInfo(
  isoDateTime?: string,
  hasSpecificTime = true,
  now = new Date()
): CountdownInfo {
  const empty: CountdownInfo = {
    status: 'future',
    label: '',
    shortLabel: '',
    isFuture: false,
    isPassed: false,
    isPast: false,
    isImminent: false,
    isValid: false,
    diffMinutes: 0,
    diffDays: 0,
    diffHours: 0,
  };

  // Countdown ONLY exists when a Plan has an actual structured date/time value.
  // No date/time selected: No countdown.
  // Date selected but no time: Do not assume a time, no countdown.
  // Date + time selected: Enable countdown/tracking.
  if (!isoDateTime || !hasSpecificTime) {
    return empty;
  }

  const targetDate = new Date(isoDateTime);
  if (isNaN(targetDate.getTime())) {
    return empty;
  }

  const makeResult = (
    status: CountdownStatus,
    label: string,
    shortLabel: string,
    isFuture: boolean,
    isPassed: boolean,
    diffMinutes: number,
    diffDays: number,
    diffHours: number
  ): CountdownInfo => ({
    status,
    label,
    shortLabel,
    isFuture,
    isPassed,
    isPast: isPassed || status === 'started',
    isImminent: status === 'imminent',
    isValid: true,
    diffMinutes,
    diffDays,
    diffHours,
  });

  const diffMs = targetDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Exact Date + Time countdown
  if (diffMs > 0) {
    // Future
    if (diffDays >= 2) {
      return makeResult('future', `${diffDays} days remaining`, `${diffDays}d left`, true, false, diffMinutes, diffDays, diffHours);
    } else if (diffHours >= 24) {
      return makeResult('future', '1 day remaining', '1d left', true, false, diffMinutes, 1, diffHours);
    } else if (diffHours >= 2) {
      return makeResult('future', `${diffHours} hours remaining`, `${diffHours}h left`, true, false, diffMinutes, 0, diffHours);
    } else if (diffMinutes >= 60) {
      return makeResult('future', '1 hour remaining', '1h left', true, false, diffMinutes, 0, 1);
    } else if (diffMinutes >= 10) {
      return makeResult('future', `${diffMinutes} minutes remaining`, `${diffMinutes}m left`, true, false, diffMinutes, 0, 0);
    } else if (diffMinutes > 1) {
      return makeResult('imminent', `Starts in ${diffMinutes} minutes`, `in ${diffMinutes}m`, true, false, diffMinutes, 0, 0);
    } else {
      return makeResult('imminent', 'Starts in < 1 minute', 'Starting', true, false, 1, 0, 0);
    }
  } else {
    // Time has passed: use stored timestamp, not display text
    const absMinutes = Math.abs(diffMinutes);
    if (absMinutes <= 180) {
      // Within 3 hours of start
      return makeResult('started', 'Started', 'Started', false, true, diffMinutes, 0, diffHours);
    } else {
      return makeResult('passed', 'Passed', 'Passed', false, true, diffMinutes, 0, diffHours);
    }
  }
}

/**
 * Custom React Hook that automatically recalculates countdown without requiring a page refresh
 */
export function useLiveCountdown(isoDateTime?: string, hasSpecificTime = true): CountdownInfo {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!isoDateTime) return;

    // Check how close we are to determine interval frequency
    const target = new Date(isoDateTime).getTime();
    const diff = Math.abs(target - Date.now());
    // If within 1 hour, update every 5 seconds; otherwise update every 30 seconds
    const intervalMs = diff < 60 * 60 * 1000 ? 5000 : 30000;

    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isoDateTime]);

  return getCountdownInfo(isoDateTime, hasSpecificTime, now);
}
