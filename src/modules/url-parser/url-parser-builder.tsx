import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Warning } from "@phosphor-icons/react";
import { type ParamItem } from "./use-url-parser";

interface URLParserBuilderProps {
  searchParams: ParamItem[];
  hashParams: ParamItem[];
  toggleSearchParam: (id: string) => void;
  updateSearchParam: (id: string, value: string) => void;
  toggleHashParam: (id: string) => void;
  updateHashParam: (id: string, value: string) => void;
}

export function URLParserBuilder({
  searchParams,
  hashParams,
  toggleSearchParam,
  updateSearchParam,
  toggleHashParam,
  updateHashParam,
}: URLParserBuilderProps) {
  const hasParams = searchParams.length > 0 || hashParams.length > 0;

  if (!hasParams) {
    return (
      <Card className="flex h-full flex-col items-center justify-center border-dashed p-8 text-center text-muted-foreground">
        <p>No URL provided yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Parameters</CardTitle>
        <CardDescription>
          Select which parameters to include in the final URL. Tracking parameters are highlighted and unchecked by default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {searchParams.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Search Params</h3>
              <div className="space-y-3">
                {searchParams.map((param) => (
                  <div key={param.id} className="flex items-start space-x-3">
                    <Checkbox id={param.id} checked={param.enabled} onCheckedChange={() => toggleSearchParam(param.id)} className="mt-1" />
                    <div className="flex w-full flex-wrap items-center gap-2 leading-none">
                      <label
                        htmlFor={param.id}
                        className="flex cursor-pointer items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all">{param.key}</span>
                        <span className="text-muted-foreground">=</span>
                      </label>
                      <Input
                        variant={"subtle"}
                        value={param.value}
                        onChange={(e) => updateSearchParam(param.id, e.target.value)}
                        className="h-6 max-w-[200px] min-w-[60px] flex-1 px-1.5 py-0 font-mono text-xs"
                      />
                      {param.isTracking && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-2xs font-bold text-destructive uppercase">
                          <Warning weight="bold" />
                          Tracker
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hashParams.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Hash Params</h3>
              <div className="space-y-3">
                {hashParams.map((param) => (
                  <div key={param.id} className="flex items-start space-x-3">
                    <Checkbox id={param.id} checked={param.enabled} onCheckedChange={() => toggleHashParam(param.id)} className="mt-1" />
                    <div className="flex w-full flex-wrap items-center gap-2 leading-none">
                      <label
                        htmlFor={param.id}
                        className="flex cursor-pointer items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all">{param.key}</span>
                        <span className="text-muted-foreground">=</span>
                      </label>
                      <Input
                        variant={"subtle"}
                        value={param.value}
                        onChange={(e) => updateHashParam(param.id, e.target.value)}
                        className="h-6 max-w-[200px] min-w-[60px] flex-1 px-1.5 py-0 font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
