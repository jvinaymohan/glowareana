import { cookies } from "next/headers";
import {
  PLATFORM_ADMIN_COOKIE,
  PLATFORM_COOKIE_MAX_AGE_SEC,
  PLATFORM_USER_COOKIE,
  signAdminJwt,
  signUserJwt,
  verifyAdminJwt,
  verifyUserJwt,
} from "@/lib/platform/session-jwt";

export async function setPlatformAdminSession(input: {
  adminUserId: string;
  role:
    | "OWNER"
    | "STORE_MANAGER"
    | "EMPLOYEE"
    | "FLOOR_SUPERVISOR"
    | "CASH_POS_USER"
    | "ADMIN_SUPPORT";
  storeIds: string[];
}): Promise<void> {
  const token = await signAdminJwt({
    typ: "admin",
    adminUserId: input.adminUserId,
    role: input.role,
    storeIds: input.storeIds,
  });
  const jar = await cookies();
  jar.set(PLATFORM_ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PLATFORM_COOKIE_MAX_AGE_SEC,
  });
}

export async function setPlatformUserSession(userId: string): Promise<void> {
  const token = await signUserJwt({ typ: "user", userId });
  const jar = await cookies();
  jar.set(PLATFORM_USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PLATFORM_COOKIE_MAX_AGE_SEC,
  });
}

export async function clearPlatformAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(PLATFORM_ADMIN_COOKIE);
}

export async function clearPlatformUserSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(PLATFORM_USER_COOKIE);
}

export async function getPlatformAdminSession(): Promise<{
  adminUserId: string;
  role:
    | "OWNER"
    | "STORE_MANAGER"
    | "EMPLOYEE"
    | "FLOOR_SUPERVISOR"
    | "CASH_POS_USER"
    | "ADMIN_SUPPORT";
  storeIds: string[];
} | null> {
  const jar = await cookies();
  const token = jar.get(PLATFORM_ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAdminJwt(token);
  if (!payload) return null;
  return {
    adminUserId: payload.adminUserId,
    role: payload.role,
    storeIds: payload.storeIds,
  };
}

export async function getPlatformUserSession(): Promise<{ userId: string } | null> {
  const jar = await cookies();
  const token = jar.get(PLATFORM_USER_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyUserJwt(token);
  if (!payload) return null;
  return { userId: payload.userId };
}
