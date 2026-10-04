import { compactVerify, importJWK, importPKCS8, importSPKI, SignJWT, type JWTPayload, type JWK } from "jose";
import { isHmacAlg, isJwtAlg, type JwtAlg } from "./algorithms";

export type JwtHeader = Record<string, unknown> & { alg?: string; typ?: string };

export type DecodeResult =
  | {
      ok: true;
      header: JwtHeader;
      payload: JWTPayload;
      signature: string;
      unsigned: boolean;
    }
  | { ok: false; error: string };

export type SignResult = { ok: true; token: string } | { ok: false; error: string };

export type VerifyStatus =
  | { status: "empty" }
  | { status: "malformed"; error: string }
  | { status: "unsigned" }
  | { status: "unsupported"; error: string }
  | { status: "missing-key" }
  | { status: "valid" }
  | { status: "invalid"; error: string };

export type TimeClaim = {
  name: "iat" | "nbf" | "exp";
  label: string;
  unix: number;
  iso: string;
};

const TIME_CLAIMS: { name: TimeClaim["name"]; label: string }[] = [
  { name: "iat", label: "Issued at" },
  { name: "nbf", label: "Not before" },
  { name: "exp", label: "Expires" },
];

export function decodeJwt(token: string): DecodeResult {
  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a JWT to decode." };
  }

  const parts = trimmed.split(".");
  if (parts.length !== 2 && parts.length !== 3) {
    return { ok: false, error: "A JWT must have two or three period-separated parts." };
  }

  const [headerPart, payloadPart, signaturePart = ""] = parts;

  try {
    const header = parseJsonObject(base64UrlDecode(headerPart), "header");
    const payload = parseJsonObject(base64UrlDecode(payloadPart), "payload") as JWTPayload;
    const unsigned = !signaturePart || header.alg === "none";
    return { ok: true, header, payload, signature: signaturePart, unsigned };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not decode JWT." };
  }
}

export async function verifyJwt(token: string, secret: string, publicKey: string, privateKey: string): Promise<VerifyStatus> {
  const trimmed = token.trim();
  if (!trimmed) return { status: "empty" };

  const decoded = decodeJwt(trimmed);
  if (!decoded.ok) return { status: "malformed", error: decoded.error };
  if (decoded.unsigned) return { status: "unsigned" };

  const alg = decoded.header.alg;
  if (!isJwtAlg(alg)) {
    return { status: "unsupported", error: `Unsupported alg "${String(alg ?? "")}".` };
  }

  try {
    const key = await importVerifyKey(alg, secret, publicKey, privateKey);
    if (!key) return { status: "missing-key" };
    await compactVerify(trimmed, key, { algorithms: [alg] });
    return { status: "valid" };
  } catch (error) {
    return { status: "invalid", error: friendlyCryptoError(error, "verify") };
  }
}

export async function signJwt(headerText: string, payloadText: string, alg: JwtAlg, secret: string, privateKey: string): Promise<SignResult> {
  let header: JwtHeader;
  let payload: JWTPayload;

  try {
    header = parseJsonObject(headerText, "header");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid header JSON." };
  }

  try {
    payload = parseJsonObject(payloadText, "payload") as JWTPayload;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid payload JSON." };
  }

  const protectedHeader = { ...header, alg };

  try {
    const key = await importSignKey(alg, secret, privateKey);
    if (!key) {
      return { ok: false, error: isHmacAlg(alg) ? "Enter a secret to sign." : "Enter a private key to sign." };
    }
    const token = await new SignJWT(payload).setProtectedHeader(protectedHeader).sign(key);
    return { ok: true, token };
  } catch (error) {
    return { ok: false, error: friendlyCryptoError(error, "sign") };
  }
}

export function extractTimeClaims(payload: JWTPayload): TimeClaim[] {
  const claims: TimeClaim[] = [];
  for (const claim of TIME_CLAIMS) {
    const value = payload[claim.name];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const millis = value > 1e12 ? value : value * 1000;
    claims.push({
      name: claim.name,
      label: claim.label,
      unix: value,
      iso: new Date(millis).toISOString(),
    });
  }
  return claims;
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parseJsonObject(source: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error(`Invalid JSON in JWT ${label}.`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`JWT ${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

function base64UrlDecode(input: string): string {
  if (!input) {
    throw new Error("JWT part is empty.");
  }
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error("JWT part is not valid base64url.");
  }
}

async function importVerifyKey(alg: JwtAlg, secret: string, publicKey: string, privateKey: string) {
  if (isHmacAlg(alg)) {
    const trimmed = secret;
    if (!trimmed) return null;
    return new TextEncoder().encode(trimmed);
  }

  const pemOrJwk = publicKey.trim() || privateKey.trim();
  if (!pemOrJwk) return null;

  if (publicKey.trim()) {
    return importAsymmetricKey(publicKey, alg, "public");
  }
  return importAsymmetricKey(privateKey, alg, "private");
}

async function importSignKey(alg: JwtAlg, secret: string, privateKey: string) {
  if (isHmacAlg(alg)) {
    if (!secret) return null;
    return new TextEncoder().encode(secret);
  }
  if (!privateKey.trim()) return null;
  return importAsymmetricKey(privateKey, alg, "private");
}

async function importAsymmetricKey(input: string, alg: JwtAlg, role: "public" | "private") {
  const trimmed = input.trim();
  if (trimmed.startsWith("{")) {
    let jwk: JWK;
    try {
      jwk = JSON.parse(trimmed) as JWK;
    } catch {
      throw new Error("Key looks like JSON but is not a valid JWK.");
    }
    return importJWK(jwk, alg);
  }

  if (trimmed.includes("BEGIN RSA PRIVATE KEY") || trimmed.includes("BEGIN RSA PUBLIC KEY") || trimmed.includes("BEGIN EC PRIVATE KEY")) {
    throw new Error("Use PKCS#8 private keys (BEGIN PRIVATE KEY) or SPKI public keys (BEGIN PUBLIC KEY), or a JWK.");
  }

  if (role === "private" || trimmed.includes("BEGIN PRIVATE KEY")) {
    return importPKCS8(trimmed, alg);
  }
  return importSPKI(trimmed, alg);
}

function friendlyCryptoError(error: unknown, action: "sign" | "verify"): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/alg/i.test(message) && /not allowed|mismatch|unsupported/i.test(message)) {
    return `Algorithm does not match this key (${action}).`;
  }
  if (/key|PKCS|SPKI|JWK|import/i.test(message)) {
    return message;
  }
  if (action === "verify") {
    return "Signature is invalid for this key.";
  }
  return message || `Could not ${action} JWT.`;
}
