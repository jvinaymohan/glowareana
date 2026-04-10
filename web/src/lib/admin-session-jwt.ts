import { SignJWT, jwtVerify } from "jose";
import {
  AUTH_COOKIE_MAX_AGE_SEC,
  getJwtSecretKey,
} from "@/lib/auth-jwt";

export const ADMIN_SESSION_COOKIE_NAME = "glow_admin_session";

const ADMIN_SUB = "ga-admin";

export async function signAdminSessionToken(): Promise<string> {
  return new SignJWT({ ga_admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ADMIN_SUB)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_COOKIE_MAX_AGE_SEC}s`)
    .sign(getJwtSecretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return (
      payload.sub === ADMIN_SUB && payload.ga_admin === true
    );
  } catch {
    return false;
  }
}
