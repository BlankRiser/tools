import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { CheckIcon, CopyIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { URLParserBuilder } from "./url-parser-builder";
import { URLParserInput } from "./url-parser-input";
import { useUrlParser } from "./use-url-parser";

export function URLParserPage() {
  const {
    inputUrl,
    setInputUrl,
    isValid,
    parsedUrl,
    searchParams,
    toggleSearchParam,
    updateSearchParam,
    hashParams,
    toggleHashParam,
    updateHashParam,
    finalUrl,
  } = useUrlParser();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">URL Parser</h1>
          <p className="mt-2 text-muted-foreground">Parse, inspect, and safely copy URLs. Automatically detects and strips tracking parameters.</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label htmlFor="url-input">Enter URL</Label>
            <Input
              id="url-input"
              placeholder="https://example.com/path?param=value"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className={!isValid && inputUrl ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {!isValid && inputUrl && <p className="text-sm font-medium text-destructive">Please enter a valid URL.</p>}
          </div>

          {!parsedUrl && !inputUrl && (
            <Alert>
              <WarningCircleIcon className="h-4 w-4" />
              <AlertDescription>Enter a URL to see its metadata and edit its parameters.</AlertDescription>
            </Alert>
          )}

          {finalUrl && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Final URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={finalUrl} readOnly className="h-10 bg-background font-mono text-sm" />
                  <Button size="icon" variant="default" onClick={handleCopy} className="size-10 shrink-0">
                    {copied ? <CheckIcon weight="bold" /> : <CopyIcon weight="bold" />}
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {parsedUrl && (
          <div className="flex flex-col gap-6">
            <URLParserInput parsedUrl={parsedUrl} />
            <URLParserBuilder
              searchParams={searchParams}
              hashParams={hashParams}
              toggleSearchParam={toggleSearchParam}
              updateSearchParam={updateSearchParam}
              toggleHashParam={toggleHashParam}
              updateHashParam={updateHashParam}
            />
          </div>
        )}
      </div>
    </GlobalErrorBoundary>
  );
}
