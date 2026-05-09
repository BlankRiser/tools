import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import { CornersOutIcon, CornersInIcon } from "@phosphor-icons/react";
import { Virtualizer } from "@pierre/diffs";
import { parseDiffFromFile } from "@pierre/diffs";
import { FileDiff, VirtualizerContext } from "@pierre/diffs/react";
import { useState, useRef } from "react";
import { useDiffOptions, type DiffOptionsState } from "./use-diff-options";

export default function DiffCheckerPage() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [fileName, setFileName] = useState("file.txt");
  const [diffData, setDiffData] = useState<any>(null);
  const [diffKey, setDiffKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { options, dispatch } = useDiffOptions();

  const diffRef = useRef<HTMLDivElement>(null);
  const virtualizerInstanceRef = useRef(new Virtualizer());

  const handleCheckDiff = () => {
    try {
      const data = parseDiffFromFile({ name: fileName, contents: oldText }, { name: fileName, contents: newText });

      // Create a fresh virtualizer instance for the new diff
      virtualizerInstanceRef.current = new Virtualizer();

      setDiffData(data);
      setDiffKey((k) => k + 1);

      setTimeout(() => {
        diffRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diff Checker</h1>
          <p className="mt-2 text-muted-foreground">Compare two snippets of text to see what changed.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className="text-lg font-semibold">Original Text</Label>
            <Textarea
              className="h-[620px] resize-none font-mono"
              placeholder="Paste original text here..."
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-lg font-semibold">Modified Text</Label>
            <Textarea
              className="h-[620px] resize-none font-mono"
              placeholder="Paste modified text here..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
          </div>
        </div>

        <Button size="lg" className="w-fit" onClick={handleCheckDiff}>
          Check Diff
        </Button>

        {diffData && (
          <div ref={diffRef} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-6 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex flex-col gap-2">
                <Label>File Name</Label>
                <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g. index.tsx" className="w-[180px]" />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Theme</Label>
                <Select value={options.theme} onValueChange={(v) => dispatch({ type: "SET_THEME", payload: v as DiffOptionsState["theme"] })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pierre-dark">Pierre Dark</SelectItem>
                    <SelectItem value="pierre-light">Pierre Light</SelectItem>
                    <SelectItem value="github-dark">GitHub Dark</SelectItem>
                    <SelectItem value="github-light">GitHub Light</SelectItem>
                    <SelectItem value="dracula">Dracula</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>View Mode</Label>
                <Select value={options.diffStyle} onValueChange={(v) => dispatch({ type: "SET_DIFF_STYLE", payload: v as any })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="split">Split</SelectItem>
                    <SelectItem value="unified">Unified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Indicators</Label>
                <Select value={options.diffIndicators} onValueChange={(v) => dispatch({ type: "SET_DIFF_INDICATORS", payload: v as any })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic (+-)</SelectItem>
                    <SelectItem value="bars">Bars</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Highlight</Label>
                <Select value={options.lineDiffType} onValueChange={(v) => dispatch({ type: "SET_LINE_DIFF_TYPE", payload: v as any })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word-alt">Word (Alt)</SelectItem>
                    <SelectItem value="word">Word</SelectItem>
                    <SelectItem value="char">Character</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition-all",
                isFullscreen ? "fixed inset-0 z-50 h-dvh w-screen rounded-none" : "",
              )}
            >
              <div className="flex items-center justify-between border-b bg-muted/50 p-4 font-medium">
                <span>Resulting Diff</span>
                <div className="flex items-center gap-4">
                  <div className="mr-2 flex items-center gap-4 text-sm font-normal">
                    <div className="flex items-center gap-1.5">
                      <Checkbox id="render-bg" checked={!options.disableBackground} onCheckedChange={() => dispatch({ type: "TOGGLE_BACKGROUND" })} />
                      <Label htmlFor="render-bg" className="cursor-pointer font-normal text-muted-foreground">
                        Background
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox id="wrap-lines" checked={options.wrapLines} onCheckedChange={() => dispatch({ type: "TOGGLE_WRAP_LINES" })} />
                      <Label htmlFor="wrap-lines" className="cursor-pointer font-normal text-muted-foreground">
                        Wrap
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id="line-numbers"
                        checked={!options.disableLineNumbers}
                        onCheckedChange={() => dispatch({ type: "TOGGLE_LINE_NUMBERS" })}
                      />
                      <Label htmlFor="line-numbers" className="cursor-pointer font-normal text-muted-foreground">
                        Numbers
                      </Label>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="h-8 gap-1.5">
                    {isFullscreen ? (
                      <>
                        <CornersInIcon className="h-4 w-4" />
                        Exit Fullscreen
                      </>
                    ) : (
                      <>
                        <CornersOutIcon className="h-4 w-4" />
                        Fullscreen
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className={cn("relative overflow-auto", isFullscreen ? "h-full flex-1" : "max-h-[600px]")}>
                <VirtualizerContext.Provider value={virtualizerInstanceRef.current}>
                  <FileDiff
                    key={diffKey}
                    fileDiff={diffData}
                    options={{
                      theme: options.theme as any,
                      diffStyle: options.diffStyle,
                      diffIndicators: options.diffIndicators,
                      lineDiffType: options.lineDiffType,
                      disableBackground: options.disableBackground,
                      overflow: options.wrapLines ? "wrap" : "scroll",
                      disableLineNumbers: options.disableLineNumbers,
                    }}
                  />
                </VirtualizerContext.Provider>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlobalErrorBoundary>
  );
}
