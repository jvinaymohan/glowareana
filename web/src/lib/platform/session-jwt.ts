import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretKey } from "@/lib/auth-jwt";

export const PLATFORM_ADMIN_COOKIE = "ga_admin_v2";
export const PLATFORM_USER_COOKIE = "ga_user_v2";
export const PLATFORM_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 14;

type AdminPayload = {
  typ: "admin";
  adminUserId: string;
  role:
    | "OWNER"
    | "STORE_MANAGER"
    | "EMPLOYEE"
    | "FLOOR_SUPERVISOR"
    | "CASH_POS_USER"
    | "ADMIN_SUPPORT";
  storeIds: string[];
};

type UserPayload = {
  typ: "user";
  userId: string;
};

export async function signAdminJwt(payload: AdminPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.adminUserId)
    .setIssuedAt()
    .setExpirationTime(`${PLATFORM_COOKIE_MAX_AGE_SEC}s`)
    .sign(getJwtSecretKey());
}

export async function signUserJwt(payload: UserPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${PLATFORM_COOKIE_MAX_AGE_SEC}s`)
    .sign(getJwtSecretKey());
}

export async function verifyAdminJwt(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (payload.typ !== "admin") return null;
    const role = payload.role;
    if (
      role !== "OWNER" &&
      role !== "STORE_MANAGER" &&
      role !== "EMPLOYEE" &&
      role !== "FLOOR_SUPERVISOR" &&
      role !== "CASH_POS_USER" &&
      role !== "ADMIN_SUPPORT"
    ) {
      return null;
    }
    const storeIds = Array.isArray(payload.storeIds)
      ? payload.storeIds.filter((x): x is string => typeof x === "string")
      : [];
    const adminUserId = payload.adminUserId;
    if (typeof adminUserId !== "string" || !adminUserId) return null;
    return { typ: "admin", adminUserId, role, storeIds };
  } catch {
    return null;
  }
}

export async function verifyUserJwt(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (payload.typ !== "user") return null;
    const userId = payload.userId;
    if (typeof userId !== "string" || !userId) return null;
    return { typ: "user", userId };
  } catch {
    return null;
  }
}
