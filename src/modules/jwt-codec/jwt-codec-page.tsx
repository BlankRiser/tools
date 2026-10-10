import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { CopyButton } from "#/components/ui/copy-button";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { CheckCircleIcon, ShieldWarningIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { isHmacAlg, isJwtAlg, JWT_ALG_GROUPS, type JwtAlg } from "./algorithms";
import { decodeJwt, extractTimeClaims, prettyJson, signJwt, verifyJwt, type VerifyStatus } from "./jwt";

const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const SAMPLE_SECRET = "your-256-bit-secret";

const DEFAULT_HEADER = prettyJson({ alg: "HS256", typ: "JWT" });
const DEFAULT_PAYLOAD = prettyJson({ sub: "1234567890", name: "John Doe", iat: 1516239022 });

type LastEdit = "encoded" | "decoded";

export function JwtCodecPage() {
  const [encoded, setEncoded] = useState("");
  const [headerText, setHeaderText] = useState("");
  const [payloadText, setPayloadText] = useState("");
  const [alg, setAlg] = useState<JwtAlg>("HS256");
  const [secret, setSecret] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [lastEdit, setLastEdit] = useState<LastEdit>("encoded");
  const [signError, setSignError] = useState<string | null>(null);
  const [verify, setVerify] = useState<VerifyStatus>({ status: "empty" });

  const decoded = useMemo(() => decodeJwt(encoded), [encoded]);
  const timeClaims = decoded.ok ? extractTimeClaims(decoded.payload) : [];
  const hmac = isHmacAlg(alg);

  const headerError = jsonFieldError(headerText, "header");
  const payloadError = jsonFieldError(payloadText, "payload");

  const applyEncoded = (value: string) => {
    setEncoded(value);
    setLastEdit("encoded");
    setSignError(null);
    const result = decodeJwt(value);
    if (!result.ok) return;
    setHeaderText(prettyJson(result.header));
    setPayloadText(prettyJson(result.payload));
    if (isJwtAlg(result.header.alg)) setAlg(result.header.alg);
  };

  const applyDecoded = (next: { header?: string; payload?: string; alg?: JwtAlg }) => {
    setLastEdit("decoded");
    if (next.header !== undefined) setHeaderText(next.header);
    if (next.payload !== undefined) setPayloadText(next.payload);
    if (next.alg !== undefined) {
      setAlg(next.alg);
      setHeaderText(patchHeaderAlg(next.header ?? headerText, next.alg));
    }
  };

  const loadSample = () => {
    setPublicKey("");
    setPrivateKey("");
    setAlg("HS256");
    setSecret(SAMPLE_SECRET);
    applyEncoded(SAMPLE_TOKEN);
  };

  const clearAll = () => {
    setEncoded("");
    setHeaderText("");
    setPayloadText("");
    setAlg("HS256");
    setSecret("");
    setPublicKey("");
    setPrivateKey("");
    setLastEdit("encoded");
    setSignError(null);
    setVerify({ status: "empty" });
  };

  useEffect(() => {
    if (lastEdit !== "decoded") return;
    if (headerError || payloadError) {
      setSignError(headerError ?? payloadError);
      return;
    }
    if (!headerText.trim() || !payloadText.trim()) {
      setSignError(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await signJwt(headerText, payloadText, alg, secret, privateKey);
      if (cancelled) return;
      if (result.ok) {
        setEncoded(result.token);
        setSignError(null);
      } else {
        setSignError(result.error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lastEdit, headerText, payloadText, alg, secret, privateKey, headerError, payloadError]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const status = await verifyJwt(encoded, secret, publicKey, privateKey);
      if (!cancelled) setVerify(status);
    })();
    return () => {
      cancelled = true;
    };
  }, [encoded, secret, publicKey, privateKey]);

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">JWT Encoder / Decoder</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Decode compact JWTs, inspect header and payload, check signatures, and create tokens with HMAC, RSA, or ECDSA. All crypto stays in your
              browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={loadSample}>
              Sample
            </Button>
            <Button variant="ghost" onClick={clearAll} disabled={!encoded && !headerText && !payloadText && !secret && !publicKey && !privateKey}>
              <TrashIcon data-icon="inline-start" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="jwt-encoded" className="text-lg font-semibold">
                Encoded token
              </Label>
              <CopyButton value={encoded} />
            </div>
            <Textarea
              id="jwt-encoded"
              value={encoded}
              onChange={(event) => applyEncoded(event.target.value)}
              spellCheck={false}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
              className="field-sizing-fixed h-64 resize-none overflow-auto font-mono text-sm break-all"
              aria-invalid={encoded.trim() && !decoded.ok ? true : undefined}
            />
            <TokenParts token={encoded} />
            {encoded.trim() && !decoded.ok && <p className="text-sm font-medium text-destructive">{decoded.error}</p>}
          </div>

          <div className="flex flex-col gap-4">
            <JsonEditor
              id="jwt-header"
              label="Header"
              value={headerText}
              error={headerError}
              placeholder={DEFAULT_HEADER}
              onChange={(value) => applyDecoded({ header: value })}
            />
            <JsonEditor
              id="jwt-payload"
              label="Payload"
              value={payloadText}
              error={payloadError}
              placeholder={DEFAULT_PAYLOAD}
              onChange={(value) => applyDecoded({ payload: value })}
            />
            {timeClaims.length > 0 && (
              <ul className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 px-3 py-2.5">
                {timeClaims.map((claim) => (
                  <li key={claim.name} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {claim.label} ({claim.name})
                    </span>
                    <span className="font-mono text-xs tabular-nums">{claim.iso}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex min-w-48 flex-col gap-2">
              <Label htmlFor="jwt-alg">Algorithm</Label>
              <Select
                value={alg}
                onValueChange={(value) => {
                  if (typeof value === "string" && isJwtAlg(value)) applyDecoded({ alg: value });
                }}
              >
                <SelectTrigger id="jwt-alg" className="w-full min-w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JWT_ALG_GROUPS.map((group) => (
                    <SelectGroup key={group.family}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.algs.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1">
              <SignatureStatus verify={verify} signError={lastEdit === "decoded" ? signError : null} />
            </div>
          </div>

          {hmac ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="jwt-secret">Secret</Label>
                <CopyButton value={secret} />
              </div>
              <Textarea
                id="jwt-secret"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                spellCheck={false}
                placeholder="HMAC secret used to sign and verify"
                className="field-sizing-fixed h-24 resize-none overflow-auto font-mono text-sm"
              />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="jwt-public-key">Public key (verify)</Label>
                  <CopyButton value={publicKey} />
                </div>
                <Textarea
                  id="jwt-public-key"
                  value={publicKey}
                  onChange={(event) => setPublicKey(event.target.value)}
                  spellCheck={false}
                  placeholder={"-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----"}
                  className="field-sizing-fixed h-40 resize-none overflow-auto font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="jwt-private-key">Private key (sign)</Label>
                  <CopyButton value={privateKey} />
                </div>
                <Textarea
                  id="jwt-private-key"
                  value={privateKey}
                  onChange={(event) => setPrivateKey(event.target.value)}
                  spellCheck={false}
                  placeholder={"-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----"}
                  className="field-sizing-fixed h-40 resize-none overflow-auto font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}

function JsonEditor({
  id,
  label,
  value,
  error,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error: string | null;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-lg font-semibold">
          {label}
        </Label>
        <CopyButton value={value} />
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        placeholder={placeholder}
        className="field-sizing-fixed h-40 resize-none overflow-auto font-mono text-sm"
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

function TokenParts({ token }: { token: string }) {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(".");
  const colors = ["text-rose-500", "text-violet-500", "text-cyan-600 dark:text-cyan-400"];

  return (
    <p className="font-mono text-2xs leading-relaxed break-all">
      {parts.map((part, index) => (
        <span key={`${index}-${part.slice(0, 8)}`}>
          {index > 0 && <span className="text-muted-foreground">.</span>}
          <span className={colors[index] ?? "text-muted-foreground"}>{part || "∅"}</span>
        </span>
      ))}
    </p>
  );
}

function SignatureStatus({ verify, signError }: { verify: VerifyStatus; signError: string | null }) {
  if (signError) {
    return (
      <Alert variant="destructive">
        <WarningCircleIcon />
        <AlertTitle>Could not sign</AlertTitle>
        <AlertDescription>{signError}</AlertDescription>
      </Alert>
    );
  }

  switch (verify.status) {
    case "empty":
      return (
        <Alert>
          <AlertTitle>Signature</AlertTitle>
          <AlertDescription>Paste a token or enter claims to create one.</AlertDescription>
        </Alert>
      );
    case "malformed":
      return (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Invalid token</AlertTitle>
          <AlertDescription>{verify.error}</AlertDescription>
        </Alert>
      );
    case "unsigned":
      return (
        <Alert>
          <ShieldWarningIcon />
          <AlertTitle>Unsigned</AlertTitle>
          <AlertDescription>This token has no signature (alg none or empty signature). Creating unsigned tokens is disabled.</AlertDescription>
        </Alert>
      );
    case "unsupported":
      return (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Unsupported algorithm</AlertTitle>
          <AlertDescription>{verify.error}</AlertDescription>
        </Alert>
      );
    case "missing-key":
      return (
        <Alert>
          <ShieldWarningIcon />
          <AlertTitle>Signature not checked</AlertTitle>
          <AlertDescription>Enter a secret or key to verify this token.</AlertDescription>
        </Alert>
      );
    case "valid":
      return (
        <Alert className="border-chart-2/40 bg-chart-2/10 text-foreground">
          <CheckCircleIcon className="text-chart-2" />
          <AlertTitle>Signature verified</AlertTitle>
          <AlertDescription>Header and payload match this key.</AlertDescription>
        </Alert>
      );
    case "invalid":
      return (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Signature invalid</AlertTitle>
          <AlertDescription>{verify.error}</AlertDescription>
        </Alert>
      );
  }
}

function patchHeaderAlg(headerText: string, alg: JwtAlg): string {
  try {
    const parsed = JSON.parse(headerText) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return prettyJson({ ...(parsed as Record<string, unknown>), alg });
    }
  } catch {
    // Fall through to a fresh header when the current JSON is unusable.
  }
  return prettyJson({ alg, typ: "JWT" });
}

function jsonFieldError(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return `${label} must be a JSON object.`;
    }
    return null;
  } catch {
    return `Invalid JSON in ${label}.`;
  }
}
