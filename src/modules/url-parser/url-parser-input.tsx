import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

interface URLParserInputProps {
  parsedUrl: URL | null;
}

export function URLParserInput({ parsedUrl }: URLParserInputProps) {
  if (!parsedUrl) return null;

  const segments = parsedUrl.pathname.split("/").filter(Boolean);

  const rows = [
    { label: "Protocol", value: parsedUrl.protocol },
    { label: "Host", value: parsedUrl.host },
    parsedUrl.port && { label: "Port", value: parsedUrl.port },
    { label: "Pathname", value: parsedUrl.pathname },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map(({ label, value }) => (
          <URLAttribute key={label} label={label}>
            <span className="font-mono text-sm break-all">{value}</span>
          </URLAttribute>
        ))}

        <URLAttribute label="Segments" noBorder>
          {segments.length > 0 ? (
            <div className="flex flex-col gap-2">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">{index + 1}</span>
                  <span className="font-mono text-sm break-all">{segment}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">No path segments</span>
          )}
        </URLAttribute>
      </CardContent>
    </Card>
  );
}

function URLAttribute({ label, children, noBorder }: { label: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-4 ${!noBorder ? "border-b pb-4" : "pb-2"}`}>
      <div className="col-span-1 text-sm font-medium text-muted-foreground">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}
