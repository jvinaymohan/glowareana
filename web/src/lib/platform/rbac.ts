import type { AdminRoleName } from "@prisma/client";

export const PERMISSIONS = {
  owner: {
    allStores: true,
    reporting: true,
    users: true,
    finances: true,
    promotions: true,
    coupons: true,
    settings: true,
    reservationOps: true,
  },
  storeManager: {
    allStores: false,
    reporting: true,
    users: false,
    finances: true,
    promotions: false,
    coupons: false,
    settings: false,
    reservationOps: true,
  },
  employee: {
    allStores: false,
    reporting: false,
    users: false,
    finances: false,
    promotions: false,
    coupons: false,
    settings: false,
    reservationOps: true,
  },
  floorSupervisor: {
    allStores: false,
    reporting: false,
    users: false,
    finances: false,
    promotions: false,
    coupons: false,
    settings: false,
    reservationOps: true,
  },
  cashPosUser: {
    allStores: false,
    reporting: false,
    users: false,
    finances: true,
    promotions: false,
    coupons: false,
    settings: false,
    reservationOps: true,
  },
  adminSupport: {
    allStores: false,
    reporting: true,
    users: true,
    finances: false,
    promotions: false,
    coupons: false,
    settings: false,
    reservationOps: true,
  },
} as const;

export function canAccessStore(
  role: AdminRoleName,
  allowedStoreIds: string[],
  targetStoreId: string,
): boolean {
  if (role === "OWNER") return true;
  return allowedStoreIds.includes(targetStoreId);
}

export function assertStoreAccess(
  role: AdminRoleName,
  allowedStoreIds: string[],
  targetStoreId: string,
): { ok: true } | { ok: false; error: string } {
  if (canAccessStore(role, allowedStoreIds, targetStoreId)) return { ok: true };
  return { ok: false, error: "You do not have access to this store." };
}
