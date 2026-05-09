import { cn } from "#/lib/utils";
import { CalendarIcon, ClockIcon, HashIcon, ArrowUpRightIcon, CircleHalfIcon, CalendarBlankIcon, ArrowsCounterClockwiseIcon } from "@phosphor-icons/react";
import { CopyButton } from "../../components/ui/copy-button";
import { useDateTimeEngine } from "./use-date-time-engine";

interface MetadataItem {
  icon: React.ReactNode;
  label: string;
  value: string | number | boolean;
  mono?: boolean;
  badge?: boolean;
}

export function DateMetadataPanel() {
  const { metadata } = useDateTimeEngine();

  const items: MetadataItem[] = [
    {
      icon: <CalendarIcon weight="duotone" className="size-3.5 text-blue-500" />,
      label: "Day of Week",
      value: metadata.dayOfWeek,
    },
    {
      icon: <CalendarBlankIcon weight="duotone" className="size-3.5 text-violet-500" />,
      label: "Day of Year",
      value: `Day ${metadata.dayOfYear}`,
    },
    {
      icon: <HashIcon weight="bold" className="size-3.5 text-amber-500" />,
      label: "Week of Year",
      value: `Week ${metadata.weekOfYear}`,
    },
    {
      icon: <CalendarIcon weight="duotone" className="size-3.5 text-green-500" />,
      label: "Month",
      value: metadata.month,
    },
    {
      icon: <ArrowUpRightIcon weight="bold" className="size-3.5 text-pink-500" />,
      label: "Quarter",
      value: `Q${metadata.quarter}`,
    },
    {
      icon: <CircleHalfIcon weight="fill" className="size-3.5 text-sky-500" />,
      label: "Leap Year",
      value: metadata.isLeapYear ? "Yes" : "No",
      badge: true,
    },
    {
      icon: <ClockIcon weight="duotone" className="size-3.5 text-orange-500" />,
      label: "UTC Offset",
      value: metadata.utcOffset,
      mono: true,
    },
    {
      icon: <HashIcon weight="bold" className="size-3.5 text-teal-500" />,
      label: "Unix (sec)",
      value: String(metadata.unixSeconds),
      mono: true,
    },
    {
      icon: <HashIcon weight="bold" className="size-3.5 text-teal-400" />,
      label: "Unix (ms)",
      value: String(metadata.unixMilliseconds),
      mono: true,
    },
    {
      icon: <ArrowsCounterClockwiseIcon weight="duotone" className="size-3.5 text-primary" />,
      label: "Relative",
      value: metadata.relative,
    },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-2">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="group flex flex-col gap-1 rounded-lg border bg-muted/30 p-2 transition-colors hover:bg-muted/60">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                {item.icon}
                <span className="text-2xs font-semibold text-muted-foreground uppercase">{item.label}</span>
              </div>
              {item.mono && <CopyButton value={String(item.value)} className="opacity-0 transition-opacity group-hover:opacity-100" />}
            </div>
            <span
              className={cn(
                "text-sm leading-tight font-medium",
                item.mono && "text-xs",
                item.badge && (item.value === "Yes" ? "text-green-500" : "text-muted-foreground"),
              )}
            >
              {String(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="group flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-2xs font-medium text-muted-foreground uppercase">ISO</span>
            <span className="truncate font-mono text-xs">{metadata.iso}</span>
          </div>
          <CopyButton value={metadata.iso} className="ml-2 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="group flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-2xs font-semibold text-muted-foreground uppercase">Readable</span>
            <span className="truncate text-xs">{metadata.readable}</span>
          </div>
          <CopyButton value={metadata.readable} className="ml-2 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
}
