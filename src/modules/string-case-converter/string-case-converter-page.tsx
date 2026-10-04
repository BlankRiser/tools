import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { CopyButton } from "#/components/ui/copy-button";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { TrashIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { CASE_CONVERSIONS } from "./convert-case";

const SAMPLE = `user profile settings
XMLHttpRequest
hello-world_example`;

export function StringCaseConverterPage() {
  const [text, setText] = useState("");

  const conversions = useMemo(
    () =>
      CASE_CONVERSIONS.map((item) => ({
        ...item,
        value: text ? item.convert(text) : "",
      })),
    [text],
  );

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">String Case Converter</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Transform identifiers and prose between camelCase, snake_case, kebab-case, Title Case, and more. Each line is converted independently.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setText(SAMPLE)} disabled={text === SAMPLE}>
              Sample
            </Button>
            <Button variant="ghost" onClick={() => setText("")} disabled={!text}>
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="case-input" className="text-lg font-semibold">
              Source
            </Label>
            <Textarea
              id="case-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
              placeholder="Paste a variable name, a heading, or one identifier per line."
              className="h-128 min-h-80 resize-none overflow-auto font-mono text-sm field-sizing-fixed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Conversions</h2>
            <ul className="flex flex-col gap-2">
              {conversions.map((item) => (
                <li key={item.id} className="group flex items-start gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
                  <div className="w-32 shrink-0 pt-0.5">
                    <p className="font-mono text-xs font-medium">{item.label}</p>
                    <p className="text-2xs text-muted-foreground">{item.example}</p>
                  </div>
                  <p className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">
                    {item.value || <span className="text-muted-foreground">—</span>}
                  </p>
                  <CopyButton value={item.value} className="mt-0.5 shrink-0 opacity-60 group-hover:opacity-100" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
