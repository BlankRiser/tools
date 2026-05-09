import { Button } from "#/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/ui/collapsible";
import { GlobeIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { CopyButton } from "../../components/ui/copy-button";
import { DateMetadataPanel } from "./date-metadata-panel";

interface ClockHeaderProps {
  effectiveDate: Date;
  systemTimezone: string;
  systemOffset: string;
  utcDisplay: string;
}

export function ClockHeader({ effectiveDate, systemTimezone, systemOffset, utcDisplay }: ClockHeaderProps) {
  const localTime = format(effectiveDate, "HH:mm:ss");
  const localDate = format(effectiveDate, "EEE, MMM d yyyy");
  const utcTime = format(effectiveDate, "HH:mm:ss 'UTC'");

  return (
    <div className="flex flex-col rounded-xl border bg-linear-to-br from-card to-card/80 p-2 shadow-sm">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="group relative flex flex-col gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <GlobeIcon weight="duotone" className="size-3.5 text-primary" />
            <span className="text-2xs font-semibold text-primary uppercase">Your Timezone</span>
          </div>
          <div className="font-mono text-3xl font-bold tracking-tight tabular-nums">{localTime}</div>
          <div className="text-sm text-muted-foreground">{localDate}</div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium">{systemOffset}</span>
            <span className="truncate">{systemTimezone}</span>
          </div>
          <CopyButton
            value={format(effectiveDate, "yyyy-MM-dd'T'HH:mm:ssxxx")}
            className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
        <div className="group relative flex flex-col gap-1.5 rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center gap-2">
            <GlobeIcon weight="duotone" className="size-3.5 text-muted-foreground" />
            <span className="text-2xs font-semibold text-muted-foreground uppercase">UTC</span>
          </div>
          <div className="font-mono text-3xl font-bold tracking-tight tabular-nums">{utcTime}</div>
          <div className="text-sm text-muted-foreground">{format(effectiveDate, "EEE, MMM d yyyy")} · UTC</div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium">GMT+00:00</span>
            <span>Universal Coordinated Time</span>
          </div>
          <CopyButton value={utcDisplay} className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <ShowMetadata />
    </div>
  );
}

const ShowMetadata = () => {
  return (
    <Collapsible>
      <CollapsibleTrigger
        render={
          <Button size="sm" variant="link">
            View metadata
          </Button>
        }
      />
      <CollapsibleContent>
        <DateMetadataPanel />
      </CollapsibleContent>
    </Collapsible>
  );
};
