import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { CopyButton } from "#/components/ui/copy-button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { cn } from "#/lib/utils";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  CheckIcon,
  ClockIcon,
  CodeIcon,
  CopyIcon,
  InfoIcon,
  LightningIcon,
  SlidersHorizontalIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DAY_ABBRS, DAY_NAMES, describeCron, getNextCronRuns, MONTH_ABBRS, MONTH_NAMES, validateCron } from "./cron-utils";

type ActiveTab = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

const PRESETS: Array<{ label: string; expression: string; description: string }> = [
  { label: "Every minute", expression: "* * * * *", description: "Runs every single minute" },
  { label: "Every 5 minutes", expression: "*/5 * * * *", description: "Runs at :00, :05, :10, :15..." },
  { label: "Every 15 minutes", expression: "*/15 * * * *", description: "Runs at :00, :15, :30, :45" },
  { label: "Every 30 minutes", expression: "*/30 * * * *", description: "Runs at :00 and :30 of every hour" },
  { label: "Every hour", expression: "0 * * * *", description: "Runs at the start of every hour" },
  { label: "Every 2 hours", expression: "0 */2 * * *", description: "Runs at 00:00, 02:00, 04:00..." },
  { label: "Daily at midnight", expression: "0 0 * * *", description: "Runs every day at 00:00" },
  { label: "Daily at 9:00 AM", expression: "0 9 * * *", description: "Runs every morning at 09:00" },
  { label: "Weekdays at 9:00 AM", expression: "0 9 * * 1-5", description: "Monday to Friday at 09:00" },
  { label: "Weekdays at 6:00 PM", expression: "0 18 * * 1-5", description: "Monday to Friday at 18:00 (EOD)" },
  { label: "Every Sunday at midnight", expression: "0 0 * * 0", description: "Weekly on Sunday at 00:00" },
  { label: "1st of every month", expression: "0 0 1 * *", description: "Monthly on day 1 at midnight" },
  { label: "Quarterly (every 3 mos)", expression: "0 0 1 */3 *", description: "First day of Jan, Apr, Jul, Oct" },
  { label: "Annual (Jan 1st)", expression: "0 0 1 1 *", description: "Once a year on January 1 at 00:00" },
];

export function CronBuilderPage() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const [activeTab, setActiveTab] = useState<ActiveTab>("minute");
  const [nextRunCount, setNextRunCount] = useState<number>(5);
  const [useUtc, setUseUtc] = useState<boolean>(false);
  const [snippetLanguage, setSnippetLanguage] = useState<"crontab" | "node" | "python" | "github">("crontab");
  const [copiedAll, setCopiedAll] = useState(false);

  const validation = useMemo(() => validateCron(expression), [expression]);
  const description = useMemo(() => describeCron(expression), [expression]);
  const nextRuns = useMemo(
    () => (validation.isValid ? getNextCronRuns(expression, nextRunCount, new Date(), useUtc) : []),
    [expression, nextRunCount, useUtc, validation.isValid],
  );

  const parts = useMemo(() => {
    if (validation.isValid && validation.parts) {
      return validation.parts;
    }
    const raw = expression.trim().split(/\s+/);
    return {
      minute: raw[0] || "*",
      hour: raw[1] || "*",
      dayOfMonth: raw[2] || "*",
      month: raw[3] || "*",
      dayOfWeek: raw[4] || "*",
    };
  }, [expression, validation]);

  // Update a single part of the 5-part cron expression
  const updatePart = (partKey: ActiveTab, newValue: string) => {
    const raw = expression.trim().split(/\s+/);
    while (raw.length < 5) raw.push("*");

    const indexMap: Record<ActiveTab, number> = {
      minute: 0,
      hour: 1,
      dayOfMonth: 2,
      month: 3,
      dayOfWeek: 4,
    };
    raw[indexMap[partKey]] = newValue || "*";
    setExpression(raw.slice(0, 5).join(" "));
  };

  // Helper to toggle a value in a comma-separated list
  const toggleCommaValue = (partKey: ActiveTab, val: number | string, allValues: Array<number | string>) => {
    const current = parts[partKey];
    let selected = new Set<string>();

    if (current !== "*" && current !== "?") {
      current.split(",").forEach((item) => {
        if (item.includes("-")) {
          const [s, e] = item.split("-").map(Number);
          if (!isNaN(s) && !isNaN(e)) {
            for (let i = s; i <= e; i++) selected.add(String(i));
          }
        } else {
          selected.add(item.toUpperCase());
        }
      });
    }

    const valStr = String(val).toUpperCase();
    if (selected.has(valStr)) {
      selected.delete(valStr);
    } else {
      selected.add(valStr);
    }

    if (selected.size === 0 || selected.size === allValues.length) {
      updatePart(partKey, "*");
    } else {
      const sorted = Array.from(selected).sort((a, b) => {
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
      updatePart(partKey, sorted.join(","));
    }
  };

  // Helper to check if a specific item is selected in a field
  const isValueSelected = (partKey: ActiveTab, val: number | string): boolean => {
    const current = parts[partKey];
    if (current === "*" || current === "?") return false;
    const valStr = String(val).toUpperCase();
    const tokens = current.split(",");
    for (const t of tokens) {
      if (t.toUpperCase() === valStr) return true;
      if (t.includes("-")) {
        const [s, e] = t.split("-").map(Number);
        const num = Number(val);
        if (!isNaN(s) && !isNaN(e) && !isNaN(num) && num >= s && num <= e) return true;
      }
    }
    return false;
  };

  // Copy all next runs formatted
  const handleCopyNextRuns = async () => {
    if (nextRuns.length === 0) return;
    const text = nextRuns.map((r, i) => `#${i + 1}: ${useUtc ? r.formattedUtc : r.formatted} (${r.relative})`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      toast.success("Upcoming trigger dates copied to clipboard");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error("Failed to copy dates");
    }
  };

  // Code snippet generator
  const generatedCode = useMemo(() => {
    const expr = expression.trim();
    switch (snippetLanguage) {
      case "crontab":
        return `# Open crontab with 'crontab -e' and paste:\n${expr} /path/to/your/command.sh >> /var/log/cron.log 2>&1`;
      case "node":
        return `// Using 'node-cron' package (npm i node-cron)\nimport cron from 'node-cron';\n\ncron.schedule('${expr}', () => {\n  console.log('Cron triggered: ${expr}');\n});`;
      case "python":
        return `# Using 'croniter' package (pip install croniter)\nfrom datetime import datetime\nfrom croniter import croniter\n\nbase = datetime.now()\niter = croniter('${expr}', base)\nprint("Next run:", iter.get_next(datetime))`;
      case "github":
        return `# GitHub Actions Workflow Trigger (.github/workflows/scheduled.yml)\non:\n  schedule:\n    - cron: '${expr}'\n\njobs:\n  run-scheduled-task:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "Running scheduled job"`;
      default:
        return expr;
    }
  }, [expression, snippetLanguage]);

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col gap-4 overflow-y-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Cron Expression Builder</h1>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
              Visually build, inspect, and translate cron schedules with live human explanations and upcoming trigger dates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={expression} size="icon-sm" variant="outline" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExpression("* * * * *");
                setActiveTab("minute");
                toast.success("Reset expression to every minute");
              }}
            >
              <ArrowsClockwiseIcon data-icon="inline-start" />
              Reset
            </Button>
          </div>
        </div>

        {/* Hero Interactive Cron Expression Bar */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex flex-col gap-4">
            {/* Visual Segments Clickable Selector */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {(
                [
                  { key: "minute", label: "Minute", sub: "0 - 59", val: parts.minute },
                  { key: "hour", label: "Hour", sub: "0 - 23", val: parts.hour },
                  { key: "dayOfMonth", label: "Day of Month", sub: "1 - 31", val: parts.dayOfMonth },
                  { key: "month", label: "Month", sub: "1 - 12 (Jan-Dec)", val: parts.month },
                  { key: "dayOfWeek", label: "Day of Week", sub: "0 - 6 (Sun-Sat)", val: parts.dayOfWeek },
                ] as const
              ).map((seg) => {
                const isActive = activeTab === seg.key;
                return (
                  <button
                    key={seg.key}
                    type="button"
                    onClick={() => setActiveTab(seg.key)}
                    className={cn(
                      "group flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all sm:p-3.5",
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/30"
                        : "border-border bg-muted/30 text-foreground hover:border-primary/40 hover:bg-muted/60",
                    )}
                  >
                    <span className="font-mono text-base font-bold tracking-wide sm:text-2xl">{seg.val}</span>
                    <span className="mt-1 text-2xs font-semibold tracking-wider text-muted-foreground uppercase group-hover:text-foreground">
                      {seg.label}
                    </span>
                    <span className="text-3xs hidden text-muted-foreground/80 sm:inline">{seg.sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Direct Input & Live Feedback */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Input
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="* * * * *"
                  spellCheck={false}
                  className="pr-10 font-mono text-sm tracking-wider"
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  {validation.isValid ? (
                    <CheckIcon className="size-4 text-emerald-500" weight="bold" />
                  ) : (
                    <WarningCircleIcon className="size-4 text-destructive" weight="fill" />
                  )}
                </div>
              </div>

              {/* Status Pill */}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
                  validation.isValid
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {validation.isValid ? (
                  <>
                    <CheckIcon className="size-3.5" weight="bold" />
                    <span>Valid Syntax (5-part Cron)</span>
                  </>
                ) : (
                  <>
                    <WarningCircleIcon className="size-3.5 shrink-0" weight="fill" />
                    <span className="line-clamp-1">{validation.error}</span>
                  </>
                )}
              </div>
            </div>

            {/* Human Explanation Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <ClockIcon className="size-4 shrink-0 text-primary" weight="duotone" />
                <span className="font-semibold text-primary">Schedule:</span>
                <span className="font-medium">{description}</span>
              </div>

              {nextRuns.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-2xs text-primary">
                  <ArrowRightIcon className="size-3" />
                  <span>Next: {nextRuns[0].relative}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Common Quick Presets */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase">
            <LightningIcon className="size-3.5 text-amber-500" weight="fill" />
            <span>Quick Presets</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => {
              const isSelected = expression.trim() === p.expression;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setExpression(p.expression);
                    toast.success(`Selected preset: ${p.label}`);
                  }}
                  title={`${p.expression} - ${p.description}`}
                  className={cn(
                    "cursor-pointer rounded-md border px-2.5 py-1 text-2xs font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/80 bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area: Visual Builder (Left) + Next Trigger Dates & Code (Right) */}
        <div className="grid flex-1 items-start gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Visual Field Builder */}
          <Card className="py-3">
            <CardHeader className="py-0 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontalIcon className="size-4 text-primary" weight="duotone" />
                  <span>Visual Field Builder</span>
                </CardTitle>

                {/* Sub Tab Navigation */}
                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                  {(
                    [
                      { key: "minute", label: "Minute" },
                      { key: "hour", label: "Hour" },
                      { key: "dayOfMonth", label: "Day (Mo)" },
                      { key: "month", label: "Month" },
                      { key: "dayOfWeek", label: "Day (Wk)" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTab(t.key)}
                      className={cn(
                        "cursor-pointer rounded-md px-2 py-1 text-2xs font-medium transition-colors",
                        activeTab === t.key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 py-0">
              {/* TAB 1: MINUTE */}
              {activeTab === "minute" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Minute: <code className="font-mono font-semibold text-foreground">{parts.minute}</code>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => updatePart("minute", "*")}>
                        Every Minute (*)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("minute", "*/5")}>
                        Every 5m (*/5)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("minute", "0")}>
                        At :00
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block text-xs font-medium">Select specific minutes (0 - 59):</Label>
                    <div className="grid grid-cols-6 gap-1 sm:grid-cols-10 sm:gap-1.5">
                      {Array.from({ length: 60 }, (_, i) => {
                        const sel = isValueSelected("minute", i);
                        return (
                          <button
                            key={`min-${i}`}
                            type="button"
                            onClick={() =>
                              toggleCommaValue(
                                "minute",
                                i,
                                Array.from({ length: 60 }, (_, x) => x),
                              )
                            }
                            className={cn(
                              "flex h-7 cursor-pointer items-center justify-center rounded-md font-mono text-2xs font-medium transition-colors",
                              sel
                                ? "bg-primary font-bold text-primary-foreground shadow-xs"
                                : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {String(i).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HOUR */}
              {activeTab === "hour" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Hour: <code className="font-mono font-semibold text-foreground">{parts.hour}</code>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => updatePart("hour", "*")}>
                        Every Hour (*)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("hour", "9-17")}>
                        Work Hours (9-17)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("hour", "0")}>
                        Midnight (00)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block text-xs font-medium">Select specific hours (0 - 23):</Label>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2">
                      {Array.from({ length: 24 }, (_, i) => {
                        const sel = isValueSelected("hour", i);
                        const period = i >= 12 ? "PM" : "AM";
                        const displayH = i % 12 === 0 ? 12 : i % 12;
                        return (
                          <button
                            key={`hour-${i}`}
                            type="button"
                            onClick={() =>
                              toggleCommaValue(
                                "hour",
                                i,
                                Array.from({ length: 24 }, (_, x) => x),
                              )
                            }
                            className={cn(
                              "flex cursor-pointer flex-col items-center justify-center rounded-md p-1.5 font-mono text-2xs font-medium transition-colors",
                              sel
                                ? "bg-primary font-bold text-primary-foreground shadow-xs"
                                : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <span className="text-xs">{String(i).padStart(2, "0")}:00</span>
                            <span className="text-3xs opacity-80">
                              {displayH} {period}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DAY OF MONTH */}
              {activeTab === "dayOfMonth" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Day of Month: <code className="font-mono font-semibold text-foreground">{parts.dayOfMonth}</code>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => updatePart("dayOfMonth", "*")}>
                        Every Day (*)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("dayOfMonth", "1")}>
                        1st of Month
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("dayOfMonth", "1,15")}>
                        1st & 15th
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block text-xs font-medium">Select specific calendar days (1 - 31):</Label>
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {Array.from({ length: 31 }, (_, i) => {
                        const dayNum = i + 1;
                        const sel = isValueSelected("dayOfMonth", dayNum);
                        return (
                          <button
                            key={`dom-${dayNum}`}
                            type="button"
                            onClick={() =>
                              toggleCommaValue(
                                "dayOfMonth",
                                dayNum,
                                Array.from({ length: 31 }, (_, x) => x + 1),
                              )
                            }
                            className={cn(
                              "flex h-8 cursor-pointer items-center justify-center rounded-md font-mono text-xs font-medium transition-colors",
                              sel
                                ? "bg-primary font-bold text-primary-foreground shadow-xs"
                                : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MONTH */}
              {activeTab === "month" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Month: <code className="font-mono font-semibold text-foreground">{parts.month}</code>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => updatePart("month", "*")}>
                        Every Month (*)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("month", "*/3")}>
                        Quarterly (*/3)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("month", "1,7")}>
                        Semiannual (1,7)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block text-xs font-medium">Select specific months:</Label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {MONTH_NAMES.map((name, i) => {
                        const mNum = i + 1;
                        const sel = isValueSelected("month", mNum) || isValueSelected("month", MONTH_ABBRS[i]);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() =>
                              toggleCommaValue(
                                "month",
                                mNum,
                                Array.from({ length: 12 }, (_, x) => x + 1),
                              )
                            }
                            className={cn(
                              "flex cursor-pointer flex-col items-start rounded-md p-2 text-xs font-medium transition-colors",
                              sel
                                ? "bg-primary font-bold text-primary-foreground shadow-xs"
                                : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <span className="font-mono text-2xs opacity-80">
                              {MONTH_ABBRS[i]} ({mNum})
                            </span>
                            <span className="truncate">{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DAY OF WEEK */}
              {activeTab === "dayOfWeek" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Day of Week: <code className="font-mono font-semibold text-foreground">{parts.dayOfWeek}</code>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => updatePart("dayOfWeek", "*")}>
                        Every Day (*)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("dayOfWeek", "1-5")}>
                        Weekdays (1-5)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => updatePart("dayOfWeek", "0,6")}>
                        Weekends (0,6)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block text-xs font-medium">Select specific days of the week:</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DAY_NAMES.map((name, i) => {
                        const sel = isValueSelected("dayOfWeek", i) || isValueSelected("dayOfWeek", DAY_ABBRS[i]);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() =>
                              toggleCommaValue(
                                "dayOfWeek",
                                i,
                                Array.from({ length: 7 }, (_, x) => x),
                              )
                            }
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-md p-2.5 text-xs font-medium transition-colors",
                              sel
                                ? "bg-primary font-bold text-primary-foreground shadow-xs"
                                : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <span>{name}</span>
                            <span className="font-mono text-2xs opacity-75">
                              {DAY_ABBRS[i]} ({i})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Next Trigger Dates & Implementation Code */}
          <div className="flex flex-col gap-4">
            {/* Next Trigger Dates Card */}
            <Card className="py-3">
              <CardHeader className="py-0 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <CalendarCheckIcon className="size-4 text-emerald-500" weight="duotone" />
                    <span>Next Trigger Dates</span>
                  </CardTitle>

                  <div className="flex items-center gap-1.5">
                    {/* Timezone Switcher */}
                    <button
                      type="button"
                      onClick={() => setUseUtc(!useUtc)}
                      className={cn(
                        "rounded px-2 py-0.5 text-2xs font-medium transition-colors",
                        useUtc
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      title="Toggle UTC vs Local Time"
                    >
                      {useUtc ? "UTC" : "Local Time"}
                    </button>

                    {/* Count Select */}
                    <Select value={String(nextRunCount)} onValueChange={(val) => setNextRunCount(Number(val))}>
                      <SelectTrigger size="sm" className="h-6 text-2xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5" className="text-2xs">
                          Next 5 runs
                        </SelectItem>
                        <SelectItem value="10" className="text-2xs">
                          Next 10 runs
                        </SelectItem>
                        <SelectItem value="20" className="text-2xs">
                          Next 20 runs
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Copy All Button */}
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={handleCopyNextRuns}
                      disabled={nextRuns.length === 0}
                      title="Copy all next trigger dates"
                    >
                      {copiedAll ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="py-0">
                {nextRuns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                    <CalendarBlankIcon className="mb-2 size-8 text-muted-foreground/50" />
                    <span>No upcoming triggers found. Check cron expression syntax.</span>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80 bg-muted/10">
                    {nextRuns.map((run, idx) => (
                      <div
                        key={`run-${idx}-${run.date.toISOString()}`}
                        className="group flex items-center justify-between gap-3 p-2.5 text-xs transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="text-3xs flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            #{idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-medium text-foreground">{useUtc ? run.formattedUtc : run.formatted}</span>
                            <span className="text-2xs text-muted-foreground">{run.relative}</span>
                          </div>
                        </div>

                        <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <CopyButton value={useUtc ? run.formattedUtc : run.formatted} size="icon-xs" variant="ghost" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Implementation Snippets */}
            <Card className="py-3">
              <CardHeader className="py-0 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <CodeIcon className="size-4 text-primary" weight="duotone" />
                    <span>Implementation Snippets</span>
                  </CardTitle>

                  <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5 text-2xs">
                    {(
                      [
                        { key: "crontab", label: "Crontab" },
                        { key: "node", label: "Node.js" },
                        { key: "python", label: "Python" },
                        { key: "github", label: "GitHub" },
                      ] as const
                    ).map((lang) => (
                      <button
                        key={lang.key}
                        type="button"
                        onClick={() => setSnippetLanguage(lang.key)}
                        className={cn(
                          "cursor-pointer rounded px-2 py-0.5 font-medium transition-colors",
                          snippetLanguage === lang.key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-0">
                <div className="relative rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-foreground">
                  <pre className="overflow-x-auto leading-relaxed whitespace-pre-wrap">{generatedCode}</pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton value={generatedCode} size="icon-xs" variant="ghost" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Syntax Cheatsheet / Reference Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-2xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <InfoIcon className="size-3.5 text-primary" />
            <span className="font-semibold text-foreground">Cron Characters:</span>
            <span>
              <code className="rounded bg-muted px-1 font-mono text-foreground">*</code> Any value
            </span>
            <span>
              <code className="rounded bg-muted px-1 font-mono text-foreground">,</code> Value list (1,3,5)
            </span>
            <span>
              <code className="rounded bg-muted px-1 font-mono text-foreground">-</code> Range (1-5)
            </span>
            <span>
              <code className="rounded bg-muted px-1 font-mono text-foreground">/</code> Step values (*/15)
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span>5 Fields: min hour dom mon dow</span>
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
