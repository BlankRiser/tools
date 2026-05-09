import { TZDate, tzOffset } from "@date-fns/tz";
import { format, formatISO, parseISO, isValid, getDayOfYear, getWeek, getQuarter, isLeapYear, formatDistanceToNow, parse, fromUnixTime, getUnixTime } from "date-fns";
import type { DisplayFormat } from "../modules/date-time-converter/use-date-time-store";

export function getSystemTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    // Fallback list of common timezones
    return [
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "America/Honolulu",
      "America/Toronto",
      "America/Vancouver",
      "America/Mexico_City",
      "America/Sao_Paulo",
      "America/Buenos_Aires",
      "America/Bogota",
      "America/Lima",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Madrid",
      "Europe/Rome",
      "Europe/Amsterdam",
      "Europe/Brussels",
      "Europe/Zurich",
      "Europe/Stockholm",
      "Europe/Oslo",
      "Europe/Helsinki",
      "Europe/Warsaw",
      "Europe/Prague",
      "Europe/Vienna",
      "Europe/Budapest",
      "Europe/Bucharest",
      "Europe/Sofia",
      "Europe/Athens",
      "Europe/Istanbul",
      "Europe/Kiev",
      "Europe/Minsk",
      "Europe/Moscow",
      "Asia/Dubai",
      "Asia/Karachi",
      "Asia/Kolkata",
      "Asia/Dhaka",
      "Asia/Bangkok",
      "Asia/Singapore",
      "Asia/Shanghai",
      "Asia/Tokyo",
      "Asia/Seoul",
      "Asia/Jakarta",
      "Asia/Manila",
      "Asia/Taipei",
      "Asia/Hong_Kong",
      "Asia/Kuala_Lumpur",
      "Asia/Colombo",
      "Asia/Kathmandu",
      "Asia/Tashkent",
      "Asia/Almaty",
      "Asia/Yekaterinburg",
      "Asia/Novosibirsk",
      "Asia/Vladivostok",
      "Pacific/Auckland",
      "Pacific/Fiji",
      "Pacific/Honolulu",
      "Pacific/Guam",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Brisbane",
      "Australia/Perth",
      "Australia/Adelaide",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Nairobi",
      "Africa/Lagos",
      "Africa/Casablanca",
    ];
  }
}

export function parseInput(value: string, mode: string): Date | null {
  if (!value.trim()) return null;

  try {
    if (mode === "unix-s") {
      const ts = parseFloat(value);
      if (isNaN(ts)) return null;
      const d = fromUnixTime(ts);
      return isValid(d) ? d : null;
    }
    if (mode === "unix-ms") {
      const ts = parseFloat(value);
      if (isNaN(ts)) return null;
      const d = new Date(ts);
      return isValid(d) ? d : null;
    }

    // Try ISO parse first
    const iso = parseISO(value);
    if (isValid(iso)) return iso;

    // Try RFC 2822
    const rfc = new Date(value);
    if (isValid(rfc)) return rfc;

    // Try common custom formats
    const formats = ["yyyy-MM-dd HH:mm:ss", "MM/dd/yyyy HH:mm:ss", "dd/MM/yyyy HH:mm:ss", "yyyy-MM-dd", "MM/dd/yyyy", "dd MMM yyyy", "MMM dd, yyyy"];
    for (const fmt of formats) {
      try {
        const d = parse(value, fmt, new Date());
        if (isValid(d)) return d;
      } catch {
        // continue
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function formatDatetime(date: Date, fmt: DisplayFormat, customFmt: string): string {
  try {
    switch (fmt) {
      case "iso8601":
        return formatISO(date);
      case "rfc2822":
        return format(date, "EEE, dd MMM yyyy HH:mm:ss xx");
      case "rfc3339":
        return formatISO(date);
      case "unix":
        return String(getUnixTime(date));
      case "locale":
        return date.toLocaleString();
      case "human":
        return format(date, "MMMM do, yyyy 'at' h:mm:ss a");
      case "12hour":
        return format(date, "MM/dd/yyyy hh:mm:ss a");
      case "24hour":
        return format(date, "MM/dd/yyyy HH:mm:ss");
      case "custom":
        return format(date, customFmt || "yyyy-MM-dd HH:mm:ss");
      default:
        return formatISO(date);
    }
  } catch {
    return "Invalid Date";
  }
}

export function formatInTimezone(date: Date, timezone: string, fmt: DisplayFormat, customFmt: string): string {
  try {
    const tzDate = new TZDate(date.getTime(), timezone);
    return formatDatetime(tzDate as unknown as Date, fmt, customFmt);
  } catch {
    return "—";
  }
}

export function getOffsetMinutes(timezone: string, date: Date): number {
  try {
    return tzOffset(timezone, date);
  } catch {
    return 0;
  }
}

export function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60)
    .toString()
    .padStart(2, "0");
  const m = (abs % 60).toString().padStart(2, "0");
  return `GMT${sign}${h}:${m}`;
}

export function getMetadata(date: Date) {
  const localTz = getSystemTimezone();
  const offsetMins = getOffsetMinutes(localTz, date);
  return {
    dayOfWeek: format(date, "EEEE"),
    dayOfYear: getDayOfYear(date),
    weekOfYear: getWeek(date),
    month: format(date, "MMMM"),
    quarter: getQuarter(date),
    isLeapYear: isLeapYear(date),
    utcOffset: formatOffset(offsetMins),
    unixSeconds: getUnixTime(date),
    unixMilliseconds: date.getTime(),
    iso: formatISO(date),
    relative: formatDistanceToNow(date, { addSuffix: true }),
    readable: format(date, "EEEE, MMMM do yyyy, h:mm:ss a"),
  };
}

export function getTimezoneDisplayName(timezone: string, type: "short" | "long" = "long"): string {
  try {
    const fmt = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: type,
    });
    const parts = fmt.formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
  } catch {
    return timezone;
  }
}

export function isDaytime(date: Date, timezone: string): boolean {
  try {
    const tzDate = new TZDate(date.getTime(), timezone);
    const hour = tzDate.getHours();
    return hour >= 6 && hour < 20;
  } catch {
    return true;
  }
}

export function getFormatsForFormat(fmt: DisplayFormat, customFmt: string): string {
  const tokens: Record<DisplayFormat, string> = {
    iso8601: "ISO 8601 — yyyy-MM-dd'T'HH:mm:ssxxx",
    rfc2822: "RFC 2822 — EEE, dd MMM yyyy HH:mm:ss xx",
    rfc3339: "RFC 3339 — yyyy-MM-dd'T'HH:mm:ssxxx",
    unix: "Unix Timestamp (seconds)",
    locale: "System Locale Format",
    human: "MMMM do, yyyy 'at' h:mm:ss a",
    "12hour": "MM/dd/yyyy hh:mm:ss a",
    "24hour": "MM/dd/yyyy HH:mm:ss",
    custom: customFmt || "yyyy-MM-dd HH:mm:ss",
  };
  return tokens[fmt] ?? "";
}
