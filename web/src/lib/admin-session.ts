import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE_NAME,
  signAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/admin-session-jwt";
import { AUTH_COOKIE_MAX_AGE_SEC } from "@/lib/auth-jwt";

export async function setAdminSessionCookie(): Promise<void> {
  const token = await signAdminSessionToken();
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SEC,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function hasValidAdminSessionCookie(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!raw) return false;
  return verifyAdminSessionToken(raw);
}
