import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { CopyButton } from "#/components/ui/copy-button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { TrashIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { MatchHighlight } from "./match-highlight";
import { MatchList } from "./match-list";
import { flagsToString, REGEX_FLAGS, runRegex, type RegexFlagId } from "./run-regex";

const SAMPLE_PATTERN = "(?<user>[\\w.+-]+)@(?<host>[\\w.-]+)\\.(?<tld>\\w+)";
const SAMPLE_TEXT = `Contact us at hello@devhaven.dev or ping support@example.com.
Invalid: not-an-email, also skip root@localhost.`;
const DEFAULT_FLAGS: RegexFlagId[] = ["g", "d"];

export function RegexTesterPage() {
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState<RegexFlagId[]>(DEFAULT_FLAGS);

  const result = useMemo(() => runRegex(pattern, flags, text), [pattern, flags, text]);
  const source = `/${pattern}/${flagsToString(flags)}`;

  const toggleFlag = (id: RegexFlagId, enabled: boolean) => {
    setFlags((current) => {
      const next = enabled ? [...current, id] : current.filter((flag) => flag !== id);
      if (id === "u" && enabled) return next.filter((flag) => flag !== "v");
      if (id === "v" && enabled) return next.filter((flag) => flag !== "u");
      return next;
    });
  };

  const loadSample = () => {
    setPattern(SAMPLE_PATTERN);
    setText(SAMPLE_TEXT);
    setFlags(["g", "i", "d"]);
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Regex Tester</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Test regular expressions with live matching, capture groups, and flag toggles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={loadSample}>
              Sample
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPattern("");
                setText("");
                setFlags(DEFAULT_FLAGS);
              }}
              disabled={!pattern && !text}
            >
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="regex-pattern" className="text-lg font-semibold">
              Pattern
            </Label>
            <div className="flex items-center gap-1">
              <code className="max-w-[min(100%,28rem)] truncate font-mono text-xs text-muted-foreground">{source}</code>
              <CopyButton value={source} />
            </div>
          </div>
          <div className="flex items-stretch gap-0 overflow-hidden rounded-lg border bg-muted/20 font-mono text-sm">
            <span className="flex items-center px-3 text-muted-foreground">/</span>
            <Input
              id="regex-pattern"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              spellCheck={false}
              placeholder="(?<year>\\d{4})-(\\d{2})-(\\d{2})"
              className="h-10 rounded-none border-0 bg-transparent font-mono dark:bg-transparent"
              aria-invalid={result.ok ? undefined : true}
            />
            <span className="flex items-center px-2 text-muted-foreground">/</span>
            <span className="flex min-w-10 items-center pr-3 font-mono text-xs text-muted-foreground">{flagsToString(flags) || " "}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {REGEX_FLAGS.map((flag) => (
              <label key={flag.id} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={flags.includes(flag.id)}
                  onCheckedChange={(checked) => toggleFlag(flag.id, checked === true)}
                />
                <span className="font-mono font-medium">{flag.label}</span>
                <span className="text-xs text-muted-foreground">{flag.hint}</span>
              </label>
            ))}
          </div>
          {!result.ok && <p className="text-sm font-medium text-destructive">{result.error}</p>}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="regex-text" className="text-lg font-semibold">
              Test string
            </Label>
            <Textarea
              id="regex-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
              placeholder="Paste text to search."
              className="h-56 resize-none overflow-auto font-mono text-sm [field-sizing:fixed]"
            />
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="mb-2 text-2xs font-semibold tracking-wide text-muted-foreground uppercase">Highlight</p>
              <MatchHighlight text={text} matches={result.ok ? result.matches : []} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Matches</h2>
              <p className="text-xs tabular-nums text-muted-foreground">
                {result.ok ? `${result.matches.length} match${result.matches.length === 1 ? "" : "es"}` : "—"}
              </p>
            </div>
            <MatchList matches={result.ok ? result.matches : []} />
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
