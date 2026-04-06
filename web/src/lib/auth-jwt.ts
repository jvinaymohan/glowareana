import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "glow_session";
export const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

function getSecretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET?.trim();
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required in production");
    }
    return new TextEncoder().encode("dev-only-insecure-change-for-local");
  }
  return new TextEncoder().encode(s);
}

export async function signAuthToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_COOKIE_MAX_AGE_SEC}s`)
    .sign(getSecretKey());
}

export async function verifyAuthToken(
  token: string,
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const sub = payload.sub;
    if (typeof sub !== "string" || !sub) return null;
    return { userId: sub };
  } catch {
    return null;
  }
}
