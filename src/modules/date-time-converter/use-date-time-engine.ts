import { formatDatetime, formatInTimezone, formatOffset, getMetadata, getOffsetMinutes, getSystemTimezone, isDaytime, parseInput, } from "@/lib/date-time-utils";
import { format as dateFnsFormat, getUnixTime, isValid, parseISO } from "date-fns";
import { useCallback, useRef, useState } from "react";
import { useDateTimeStore, type InputMode } from "./use-date-time-store";

export function useDateTimeEngine() {
  const {
    baseDatetime,
    displayFormat,
    customFormat,
    timezones,
    inputValue,
    inputMode,
    setBaseDatetime,
    setInputValue,
    setInputMode,
    addTimezone,
    removeTimezone,
    togglePin,
    clearBaseDatetime,
    setDisplayFormat,
    setCustomFormat,
  } = useDateTimeStore();

  // Captured once at component mount — never changes
  const mountTimeRef = useRef(new Date());
  const [parseError, setParseError] = useState<string | null>(null);

  // The effective date: user-provided OR the page-load snapshot
  const effectiveDate: Date = (() => {
    if (baseDatetime) {
      const parsed = parseISO(baseDatetime);
      if (isValid(parsed)) return parsed;
    }
    return mountTimeRef.current;
  })();

  const systemTimezone = getSystemTimezone();
  const systemOffset = formatOffset(getOffsetMinutes(systemTimezone, effectiveDate));
  const utcDisplay = formatInTimezone(effectiveDate, "UTC", displayFormat, customFormat);
  const localDisplay = formatDatetime(effectiveDate, displayFormat, customFormat);
  const metadata = getMetadata(effectiveDate);

  const timezoneData = timezones.map((entry) => {
    const offsetMins = getOffsetMinutes(entry.timezone, effectiveDate);
    const systemOffsetMins = getOffsetMinutes(systemTimezone, effectiveDate);
    const diffFromSystem = offsetMins - systemOffsetMins;
    const sign = diffFromSystem >= 0 ? "+" : "-";
    const absDiff = Math.abs(diffFromSystem);
    const diffHours = Math.floor(absDiff / 60);
    const diffMins = absDiff % 60;
    const diffStr = absDiff === 0 ? "Same as local" : `${sign}${diffHours}h${diffMins ? ` ${diffMins}m` : ""}`;

    return {
      ...entry,
      formatted: formatInTimezone(effectiveDate, entry.timezone, displayFormat, customFormat),
      offset: formatOffset(offsetMins),
      offsetMins,
      diffFromSystem: diffStr,
      isDaytime: isDaytime(effectiveDate, entry.timezone),
      unixTs: getUnixTime(effectiveDate),
    };
  });

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setParseError(null);

      if (!value.trim()) {
        clearBaseDatetime();
        return;
      }

      const parsed = parseInput(value, inputMode);
      if (parsed && isValid(parsed)) {
        setBaseDatetime(parsed.toISOString());
      } else {
        setParseError("Could not parse this date-time. Try ISO, Unix, or RFC format.");
      }
    },
    [inputMode, setInputValue, setBaseDatetime, clearBaseDatetime],
  );

  const handleInputModeChange = useCallback(
    (mode: InputMode) => {
      setInputMode(mode);
      // Populate the input field with the current date in the new format
      const d = effectiveDate;
      switch (mode) {
        case "unix-s":
          setInputValue(String(getUnixTime(d)));
          break;
        case "unix-ms":
          setInputValue(String(d.getTime()));
          break;
        case "iso":
          setInputValue(d.toISOString());
          break;
        case "rfc":
          setInputValue(d.toUTCString());
          break;
        default:
          setInputValue(d.toISOString());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveDate.toISOString()],
  );

  const representations = [
    { label: "ISO 8601", value: effectiveDate.toISOString() },
    { label: "Unix (s)", value: String(getUnixTime(effectiveDate)) },
    { label: "Unix (ms)", value: String(effectiveDate.getTime()) },
    { label: "RFC 2822", value: dateFnsFormat(effectiveDate, "EEE, dd MMM yyyy HH:mm:ss xx") },
    { label: "UTC String", value: effectiveDate.toUTCString() },
  ];

  return {
    effectiveDate,
    systemTimezone,
    systemOffset,
    utcDisplay,
    localDisplay,
    metadata,
    timezoneData,
    displayFormat,
    customFormat,
    inputValue,
    inputMode,
    parseError,
    timezones,
    representations,
    // Actions
    handleInputChange,
    handleInputModeChange,
    addTimezone,
    removeTimezone,
    togglePin,
    clearBaseDatetime,
    setDisplayFormat,
    setCustomFormat,
  };
}
