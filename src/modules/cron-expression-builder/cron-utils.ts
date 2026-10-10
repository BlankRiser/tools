/**
 * Cron Expression Utilities
 * Parsing, validating, calculating next dates, and generating human-readable descriptions for 5-part cron expressions.
 * Standard format: minute hour day-of-month month day-of-week
 */

export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export interface CronValidationResult {
  isValid: boolean;
  error?: string;
  parts?: CronParts;
}

export interface NextRunItem {
  date: Date;
  relative: string;
  formatted: string;
  formattedUtc: string;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const MONTH_ABBRS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export const DAY_ABBRS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

// Parses a single cron field (e.g. "1-5", "*/15", "0,12,18") into a Set of allowed integers.
export function parseCronField(
  field: string,
  minVal: number,
  maxVal: number,
  nameMap?: Record<string, number>,
): Set<number> | null {
  const clean = field.trim().toUpperCase();
  if (!clean) return null;

  const result = new Set<number>();

  // Helper to resolve name or number
  const resolveVal = (valStr: string): number | null => {
    if (nameMap && valStr in nameMap) {
      return nameMap[valStr];
    }
    const num = Number(valStr);
    if (!Number.isInteger(num)) return null;
    return num;
  };

  const tokens = clean.split(",");

  for (const token of tokens) {
    if (!token) return null;

    if (token === "*" || token === "?") {
      for (let i = minVal; i <= maxVal; i++) {
        result.add(i);
      }
      continue;
    }

    // Step: e.g. "*/5" or "10-30/5" or "5/10"
    if (token.includes("/")) {
      const [rangePart, stepPart] = token.split("/");
      const step = Number(stepPart);
      if (!Number.isInteger(step) || step <= 0) return null;

      let start = minVal;
      let end = maxVal;

      if (rangePart && rangePart !== "*") {
        if (rangePart.includes("-")) {
          const [rStartStr, rEndStr] = rangePart.split("-");
          const rStart = resolveVal(rStartStr);
          const rEnd = resolveVal(rEndStr);
          if (rStart === null || rEnd === null || rStart > rEnd) return null;
          start = rStart;
          end = rEnd;
        } else {
          const singleStart = resolveVal(rangePart);
          if (singleStart === null) return null;
          start = singleStart;
        }
      }

      if (start < minVal || end > maxVal || start > end) return null;

      for (let i = start; i <= end; i += step) {
        result.add(i);
      }
      continue;
    }

    // Range: e.g. "1-5" or "MON-FRI"
    if (token.includes("-")) {
      const [startStr, endStr] = token.split("-");
      const start = resolveVal(startStr);
      const end = resolveVal(endStr);
      if (start === null || end === null || start < minVal || end > maxVal || start > end) {
        return null;
      }
      for (let i = start; i <= end; i++) {
        result.add(i);
      }
      continue;
    }

    // Single value: e.g. "5" or "WED"
    const single = resolveVal(token);
    if (single === null || single < minVal || single > maxVal) {
      return null;
    }
    result.add(single);
  }

  // Handle Sunday as 7 for Day of Week (0 and 7 are both Sunday in standard cron)
  if (minVal === 0 && maxVal === 6 && result.has(7)) {
    result.delete(7);
    result.add(0);
  }

  return result.size > 0 ? result : null;
}

const MONTH_MAP: Record<string, number> = {};
MONTH_ABBRS.forEach((abbr, idx) => {
  MONTH_MAP[abbr] = idx + 1;
});

const DAY_MAP: Record<string, number> = {};
DAY_ABBRS.forEach((abbr, idx) => {
  DAY_MAP[abbr] = idx;
});

/**
 * Validates a 5-part cron expression.
 */
export function validateCron(expression: string): CronValidationResult {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      isValid: false,
      error: `Expected 5 parts (minute, hour, day-of-month, month, day-of-week), but found ${parts.length}.`,
    };
  }

  const [min, hour, dom, mon, dow] = parts;

  if (!parseCronField(min, 0, 59)) {
    return { isValid: false, error: `Invalid minute field: "${min}". Must be 0-59.` };
  }
  if (!parseCronField(hour, 0, 23)) {
    return { isValid: false, error: `Invalid hour field: "${hour}". Must be 0-23.` };
  }
  if (!parseCronField(dom, 1, 31)) {
    return { isValid: false, error: `Invalid day-of-month field: "${dom}". Must be 1-31.` };
  }
  if (!parseCronField(mon, 1, 12, MONTH_MAP)) {
    return { isValid: false, error: `Invalid month field: "${mon}". Must be 1-12 or JAN-DEC.` };
  }
  if (!parseCronField(dow, 0, 7, DAY_MAP)) {
    return { isValid: false, error: `Invalid day-of-week field: "${dow}". Must be 0-7 (0 or 7 is Sun) or SUN-SAT.` };
  }

  return {
    isValid: true,
    parts: {
      minute: min,
      hour,
      dayOfMonth: dom,
      month: mon,
      dayOfWeek: dow,
    },
  };
}

/**
 * Generates an accurate, human-readable English description of a 5-part cron expression.
 */
export function describeCron(expression: string): string {
  const validation = validateCron(expression);
  if (!validation.isValid || !validation.parts) {
    return validation.error || "Invalid cron expression";
  }

  const { minute, hour, dayOfMonth, month, dayOfWeek } = validation.parts;

  // Common quick shortcuts
  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "Every minute";
  }
  if (minute.startsWith("*/") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Every ${minute.slice(2)} minutes`;
  }
  if (minute === "0" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "Every hour at the start of the hour";
  }
  if (minute === "0" && hour.startsWith("*/") && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Every ${hour.slice(2)} hours, on the hour`;
  }

  // 1. Time description (minute + hour)
  let timeDesc = "";
  if (hour === "*" && minute === "*") {
    timeDesc = "every minute";
  } else if (hour === "*") {
    if (minute.startsWith("*/")) {
      timeDesc = `every ${minute.slice(2)} minutes`;
    } else {
      timeDesc = `at minute ${minute} of every hour`;
    }
  } else if (minute === "*") {
    timeDesc = `every minute past hour ${formatHours(hour)}`;
  } else {
    // Specific time
    timeDesc = `at ${formatTime(hour, minute)}`;
  }

  // 2. Day description (Day of Month & Day of Week)
  let dayDesc = "";
  const isAnyDom = dayOfMonth === "*" || dayOfMonth === "?";
  const isAnyDow = dayOfWeek === "*" || dayOfWeek === "?";

  if (isAnyDom && isAnyDow) {
    dayDesc = "every day";
  } else if (!isAnyDom && isAnyDow) {
    dayDesc = `on day ${formatDayOfMonth(dayOfMonth)} of the month`;
  } else if (isAnyDom && !isAnyDow) {
    dayDesc = `on ${formatDayOfWeek(dayOfWeek)}`;
  } else {
    dayDesc = `on day ${formatDayOfMonth(dayOfMonth)} and on ${formatDayOfWeek(dayOfWeek)}`;
  }

  // 3. Month description
  let monthDesc = "";
  if (month !== "*") {
    monthDesc = ` in ${formatMonth(month)}`;
  }

  // Capitalize first letter
  const full = `${capitalize(timeDesc)}, ${dayDesc}${monthDesc}`;
  return full;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function formatTime(hourPart: string, minutePart: string): string {
  if (hourPart.includes(",") || minutePart.includes(",")) {
    return `hours (${hourPart}) and minutes (${minutePart})`;
  }
  const h = Number(hourPart);
  const m = Number(minutePart);
  if (isNaN(h) || isNaN(m)) {
    return `${hourPart}:${minutePart}`;
  }
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = String(m).padStart(2, "0");
  return `${displayH}:${displayM} ${period} (${String(h).padStart(2, "0")}:${displayM})`;
}

function formatHours(hourPart: string): string {
  return hourPart;
}

function formatDayOfMonth(dom: string): string {
  if (dom.includes("/")) return `every ${dom.split("/")[1]} days`;
  return dom;
}

function formatDayOfWeek(dow: string): string {
  if (dow === "1-5") return "weekdays (Monday to Friday)";
  if (dow === "0,6" || dow === "6,0") return "weekends (Saturday & Sunday)";

  const tokens = dow.split(",");
  const days = tokens
    .map((t) => {
      const n = Number(t);
      if (!isNaN(n)) return DAY_NAMES[n % 7];
      return t;
    })
    .join(", ");
  return days;
}

function formatMonth(mon: string): string {
  if (mon.includes("/")) return `every ${mon.split("/")[1]} months`;
  const tokens = mon.split(",");
  return tokens
    .map((t) => {
      const n = Number(t);
      if (!isNaN(n) && n >= 1 && n <= 12) return MONTH_NAMES[n - 1];
      return t;
    })
    .join(", ");
}

/**
 * Calculates the next N scheduled trigger dates for a 5-part cron expression.
 */
export function getNextCronRuns(
  expression: string,
  count = 5,
  startDate: Date = new Date(),
  useUtc = false,
): NextRunItem[] {
  const validation = validateCron(expression);
  if (!validation.isValid || !validation.parts) {
    return [];
  }

  const { minute, hour, dayOfMonth, month, dayOfWeek } = validation.parts;

  const minutesSet = parseCronField(minute, 0, 59);
  const hoursSet = parseCronField(hour, 0, 23);
  const domSet = parseCronField(dayOfMonth, 1, 31);
  const monthSet = parseCronField(month, 1, 12, MONTH_MAP);
  const dowSet = parseCronField(dayOfWeek, 0, 7, DAY_MAP);

  if (!minutesSet || !hoursSet || !domSet || !monthSet || !dowSet) {
    return [];
  }

  const isDomWildcard = dayOfMonth === "*" || dayOfMonth === "?";
  const isDowWildcard = dayOfWeek === "*" || dayOfWeek === "?";

  const results: NextRunItem[] = [];

  // Start checking from the next whole minute
  const iter = new Date(startDate.getTime());
  iter.setSeconds(0, 0);
  iter.setMinutes(iter.getMinutes() + 1);

  // Maximum search horizon: 5 years (prevent infinite loops for impossible dates)
  const maxTime = startDate.getTime() + 5 * 365 * 24 * 60 * 60 * 1000;

  while (results.length < count && iter.getTime() < maxTime) {
    const curMonth = (useUtc ? iter.getUTCMonth() : iter.getMonth()) + 1; // 1-12
    const curDom = useUtc ? iter.getUTCDate() : iter.getDate();
    const curDow = useUtc ? iter.getUTCDay() : iter.getDay(); // 0-6
    const curHour = useUtc ? iter.getUTCHours() : iter.getHours();
    const curMin = useUtc ? iter.getUTCMinutes() : iter.getMinutes();

    // 1. Check Month
    if (!monthSet.has(curMonth)) {
      // Fast forward to next month
      if (useUtc) {
        iter.setUTCMonth(iter.getUTCMonth() + 1, 1);
        iter.setUTCHours(0, 0, 0, 0);
      } else {
        iter.setMonth(iter.getMonth() + 1, 1);
        iter.setHours(0, 0, 0, 0);
      }
      continue;
    }

    // 2. Check Day (Standard Cron Rule: if both are specified, match DOM OR DOW; if either is *, match specified)
    let dayMatches = false;
    if (isDomWildcard && isDowWildcard) {
      dayMatches = true;
    } else if (!isDomWildcard && isDowWildcard) {
      dayMatches = domSet.has(curDom);
    } else if (isDomWildcard && !isDowWildcard) {
      dayMatches = dowSet.has(curDow);
    } else {
      dayMatches = domSet.has(curDom) || dowSet.has(curDow);
    }

    if (!dayMatches) {
      // Fast forward to next day
      if (useUtc) {
        iter.setUTCDate(iter.getUTCDate() + 1);
        iter.setUTCHours(0, 0, 0, 0);
      } else {
        iter.setDate(iter.getDate() + 1);
        iter.setHours(0, 0, 0, 0);
      }
      continue;
    }

    // 3. Check Hour
    if (!hoursSet.has(curHour)) {
      // Fast forward to next hour
      if (useUtc) {
        iter.setUTCHours(iter.getUTCHours() + 1, 0, 0, 0);
      } else {
        iter.setHours(iter.getHours() + 1, 0, 0, 0);
      }
      continue;
    }

    // 4. Check Minute
    if (!minutesSet.has(curMin)) {
      // Advance by 1 minute
      if (useUtc) {
        iter.setUTCMinutes(iter.getUTCMinutes() + 1);
      } else {
        iter.setMinutes(iter.getMinutes() + 1);
      }
      continue;
    }

    // All match! Record this run
    const matchDate = new Date(iter.getTime());
    results.push({
      date: matchDate,
      relative: formatRelativeFutureTime(matchDate, startDate),
      formatted: formatDateTime(matchDate, false),
      formattedUtc: formatDateTime(matchDate, true),
    });

    // Advance 1 minute to find the next run
    if (useUtc) {
      iter.setUTCMinutes(iter.getUTCMinutes() + 1);
    } else {
      iter.setMinutes(iter.getMinutes() + 1);
    }
  }

  return results;
}

/**
 * Formats relative future duration in a human-friendly way (e.g., "in 5 minutes", "in 2 hours", "tomorrow at 09:00").
 */
export function formatRelativeFutureTime(target: Date, from: Date = new Date()): string {
  const diffMs = target.getTime() - from.getTime();
  if (diffMs <= 0) return "just now";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return `in ${diffSec}s`;
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffHour < 24) {
    const remMin = diffMin % 60;
    return remMin > 0 ? `in ${diffHour}h ${remMin}m` : `in ${diffHour}h`;
  }
  if (diffDay < 7) {
    const remHour = diffHour % 24;
    return remHour > 0 ? `in ${diffDay}d ${remHour}h` : `in ${diffDay}d`;
  }
  const weeks = Math.floor(diffDay / 7);
  return `in ${weeks}w ${diffDay % 7}d`;
}

/**
 * Formats a Date object into a readable string.
 */
export function formatDateTime(date: Date, isUtc = false): string {
  const d = date;
  const dayName = isUtc ? DAY_NAMES[d.getUTCDay()] : DAY_NAMES[d.getDay()];
  const monthName = isUtc ? MONTH_ABBRS[d.getUTCMonth()] : MONTH_ABBRS[d.getMonth()];
  const day = isUtc ? d.getUTCDate() : d.getDate();
  const year = isUtc ? d.getUTCFullYear() : d.getFullYear();
  const hours = isUtc ? d.getUTCHours() : d.getHours();
  const minutes = isUtc ? d.getUTCMinutes() : d.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMin = String(minutes).padStart(2, "0");

  const tzLabel = isUtc ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";

  return `${dayName}, ${monthName} ${day}, ${year} at ${displayHours}:${displayMin} ${period} (${tzLabel})`;
}
