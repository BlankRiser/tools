import { create } from "zustand";

export type DisplayFormat =
  | "iso8601"
  | "rfc2822"
  | "rfc3339"
  | "unix"
  | "locale"
  | "human"
  | "12hour"
  | "24hour"
  | "custom";

export type InputMode = "iso" | "unix-s" | "unix-ms" | "rfc" | "custom";

export interface TimezoneEntry {
  id: string;
  timezone: string;
  pinned: boolean;
}

interface DateTimeState {
  // The user-selected base datetime (ISO string). Null = use page-load time.
  baseDatetime: string | null;
  displayFormat: DisplayFormat;
  customFormat: string;
  timezones: TimezoneEntry[];
  inputValue: string;
  inputMode: InputMode;

  // Actions
  setBaseDatetime: (dt: string) => void;
  clearBaseDatetime: () => void;
  setDisplayFormat: (format: DisplayFormat) => void;
  setCustomFormat: (fmt: string) => void;
  setInputValue: (v: string) => void;
  setInputMode: (mode: InputMode) => void;
  addTimezone: (tz: string) => void;
  removeTimezone: (id: string) => void;
  togglePin: (id: string) => void;
}

const DEFAULT_TIMEZONES: TimezoneEntry[] = [
  { id: "utc", timezone: "UTC", pinned: true },
  { id: "ny", timezone: "America/New_York", pinned: false },
  { id: "london", timezone: "Europe/London", pinned: false },
  { id: "tokyo", timezone: "Asia/Tokyo", pinned: false },
];

export const useDateTimeStore = create<DateTimeState>()((set) => ({
  baseDatetime: null,
  displayFormat: "iso8601",
  customFormat: "yyyy-MM-dd HH:mm:ss",
  timezones: DEFAULT_TIMEZONES,
  inputValue: "",
  inputMode: "iso",

  setBaseDatetime: (dt) => set({ baseDatetime: dt }),
  clearBaseDatetime: () => set({ baseDatetime: null, inputValue: "" }),
  setDisplayFormat: (displayFormat) => set({ displayFormat }),
  setCustomFormat: (customFormat) => set({ customFormat }),
  setInputValue: (inputValue) => set({ inputValue }),
  setInputMode: (inputMode) => set({ inputMode }),

  addTimezone: (tz) =>
    set((state) => {
      if (state.timezones.some((t) => t.timezone === tz)) return state;
      return {
        timezones: [
          ...state.timezones,
          { id: `${tz}-${Date.now()}`, timezone: tz, pinned: false },
        ],
      };
    }),

  removeTimezone: (id) =>
    set((state) => ({
      timezones: state.timezones.filter((t) => t.id !== id),
    })),

  togglePin: (id) =>
    set((state) => ({
      timezones: state.timezones.map((t) =>
        t.id === id ? { ...t, pinned: !t.pinned } : t
      ),
    })),
}));
