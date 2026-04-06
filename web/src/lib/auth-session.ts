import { cookies } from "next/headers";
import {
  AUTH_COOKIE_MAX_AGE_SEC,
  AUTH_COOKIE_NAME,
  signAuthToken,
  verifyAuthToken,
} from "@/lib/auth-jwt";

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await signAuthToken(userId);
  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(AUTH_COOKIE_NAME)?.value;
  if (!raw) return null;
  const v = await verifyAuthToken(raw);
  return v?.userId ?? null;
}
