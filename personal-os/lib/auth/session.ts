const COOKIE_NAME = "os_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET env var");
  return secret;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Builds a signed session token: `<expiresAtEpochSeconds>.<hmacHex>` */
export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = String(expiresAt);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return `${payload}.${toHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sigHex] = token.split(".");
  if (!payload || !sigHex) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() / 1000) return false;

  const secret = getSecret();
  const key = await hmacKey(secret);
  const expectedSig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const expectedHex = toHex(expectedSig);

  if (expectedHex.length !== sigHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    mismatch |= expectedHex.charCodeAt(i) ^ sigHex.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyApiSecret(headerValue: string | null): boolean {
  const apiSecret = process.env.API_SECRET;
  if (!apiSecret || !headerValue) return false;
  if (headerValue.length !== apiSecret.length) return false;
  let mismatch = 0;
  for (let i = 0; i < apiSecret.length; i++) {
    mismatch |= headerValue.charCodeAt(i) ^ apiSecret.charCodeAt(i);
  }
  return mismatch === 0;
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
