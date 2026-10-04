export const JWT_ALGS = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512"] as const;

export type JwtAlg = (typeof JWT_ALGS)[number];

export type JwtAlgFamily = "hmac" | "rsa" | "ecdsa";

export const JWT_ALG_GROUPS: { family: JwtAlgFamily; label: string; algs: JwtAlg[] }[] = [
  { family: "hmac", label: "HMAC", algs: ["HS256", "HS384", "HS512"] },
  { family: "rsa", label: "RSA", algs: ["RS256", "RS384", "RS512"] },
  { family: "ecdsa", label: "ECDSA", algs: ["ES256", "ES384", "ES512"] },
];

export function isJwtAlg(value: unknown): value is JwtAlg {
  return typeof value === "string" && (JWT_ALGS as readonly string[]).includes(value);
}

export function jwtAlgFamily(alg: JwtAlg): JwtAlgFamily {
  if (alg.startsWith("HS")) return "hmac";
  if (alg.startsWith("RS")) return "rsa";
  return "ecdsa";
}

export function isHmacAlg(alg: JwtAlg): boolean {
  return jwtAlgFamily(alg) === "hmac";
}
