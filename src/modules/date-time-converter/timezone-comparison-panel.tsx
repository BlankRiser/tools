import { Button } from "#/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "#/components/ui/combobox";
import { CopyButton } from "#/components/ui/copy-button";
import { cn } from "#/lib/utils";
import { MoonIcon, PushPinIcon, PushPinSlashIcon, SunIcon, XIcon } from "@phosphor-icons/react";
import { matchSorter } from "match-sorter";
import { useMemo, useState } from "react";
import { formatOffset, getAllTimezones, getOffsetMinutes, getTimezoneDisplayName } from "../../lib/date-time-utils";

interface TimezoneData {
  id: string;
  timezone: string;
  pinned: boolean;
  formatted: string;
  offset: string;
  offsetMins: number;
  diffFromSystem: string;
  isDaytime: boolean;
  unixTs: number;
}

interface TimezoneComparisonPanelProps {
  timezoneData: TimezoneData[];
  userTimezone: string;
  onAdd: (tz: string) => void;
  onRemove: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function TimezoneComparisonPanel({ timezoneData, userTimezone, onAdd, onRemove, onTogglePin }: TimezoneComparisonPanelProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const allTimezones = useMemo(() => getAllTimezones(), []);

  const addedSet = useMemo(() => new Set(timezoneData.map((t) => t.timezone)), [timezoneData]);

  const comboboxOptions = useMemo(() => {
    const now = new Date();
    return allTimezones.map((tz) => {
      const shortName = getTimezoneDisplayName(tz, "short");
      const offsetMins = getOffsetMinutes(tz, now);
      const offset = formatOffset(offsetMins);
      const hasShortName = shortName && shortName !== tz && shortName !== offset && !shortName.startsWith("GMT");

      const searchString = `${tz} ${hasShortName ? shortName : ""} ${offset}`;

      return {
        tz,
        shortName: hasShortName ? shortName : "",
        offset,
        searchString,
      };
    });
  }, [allTimezones]);

  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return comboboxOptions.slice(0, 50);
    return matchSorter(comboboxOptions, inputValue, { keys: ["searchString"] }).slice(0, 50);
  }, [comboboxOptions, inputValue]);

  const sortedData = useMemo(() => [...timezoneData].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)), [timezoneData]);

  function handleSelect(tz: string | null) {
    if (!tz || addedSet.has(tz)) return;
    onAdd(tz);
    setInputValue("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Timezone Comparison</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {timezoneData.length} zone{timezoneData.length !== 1 ? "s" : ""} · base:{" "}
            <span className="font-medium text-foreground">{userTimezone}</span>
          </p>
        </div>

        <Combobox
          open={open}
          onOpenChange={setOpen}
          value={null}
          onValueChange={handleSelect}
          inputValue={inputValue}
          onInputValueChange={setInputValue}
  
          // disabled base-ui default filter so it doesn't hide fuzzy matches
          filter={() => true}
        >
          <ComboboxInput placeholder="Add a timezone…" showTrigger={false} showClear={inputValue.length > 0} />
          <ComboboxContent align="end" className="w-full">
            <ComboboxList>
              {filteredOptions.map((opt) => {
                const alreadyAdded = addedSet.has(opt.tz);
                return (
                  <ComboboxItem key={opt.tz} value={opt.tz} disabled={alreadyAdded} className={cn(alreadyAdded && "cursor-not-allowed opacity-40")}>
                    <div className="flex flex-1 items-center gap-2 truncate">
                      <span className="truncate">{opt.tz}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {opt.shortName ? `${opt.shortName} (${opt.offset})` : opt.offset}
                      </span>
                    </div>
                    {alreadyAdded && (
                      <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                        Added
                      </span>
                    )}
                  </ComboboxItem>
                );
              })}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="flex flex-col gap-2">
        {sortedData.map((tz) => (
          <TimezoneCard
            key={tz.id}
            data={tz}
            isUserTimezone={tz.timezone === userTimezone}
            onRemove={() => onRemove(tz.id)}
            onTogglePin={() => onTogglePin(tz.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface TimezoneCardProps {
  data: TimezoneData;
  isUserTimezone: boolean;
  onRemove: () => void;
  onTogglePin: () => void;
}

function TimezoneCard({ data, isUserTimezone, onRemove, onTogglePin }: TimezoneCardProps) {
  const city = data.timezone.split("/").slice(-1)[0]?.replace(/_/g, " ") ?? data.timezone;
  const region = data.timezone.split("/")[0] ?? "";

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border p-3.5 transition-all",
        data.pinned ? "border-primary/30 bg-primary/5" : "bg-muted/20 hover:bg-muted/40",
        isUserTimezone && "border-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm leading-tight font-semibold">{city}</span>
            {isUserTimezone && (
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">
                Local
              </span>
            )}
            {data.pinned && (
              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">
                Pinned
              </span>
            )}
          </div>
          <span className="text-2xs text-muted-foreground">
            {region} · {data.timezone}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon-xs" onClick={onTogglePin} title={data.pinned ? "Unpin" : "Pin timezone"}>
            {data.pinned ? <PushPinSlashIcon weight="bold" className="text-primary" /> : <PushPinIcon weight="bold" />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onRemove} title="Remove timezone">
            <XIcon weight="bold" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {data.isDaytime ? (
            <SunIcon weight="fill" className="size-4 shrink-0 text-amber-400" />
          ) : (
            <MoonIcon weight="fill" className="size-4 shrink-0 text-indigo-400" />
          )}
          <span className="font-mono text-base font-bold tabular-nums">{data.formatted}</span>
        </div>
        <CopyButton value={data.formatted} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-2xs font-semibold text-muted-foreground">{data.offset}</span>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-2xs font-semibold",
            data.diffFromSystem === "Same as local" ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          )}
        >
          {data.diffFromSystem === "Same as local" ? "= Local" : data.diffFromSystem}
        </span>
        <span className="font-mono text-2xs text-muted-foreground">{data.unixTs}s</span>
      </div>
    </div>
  );
}
