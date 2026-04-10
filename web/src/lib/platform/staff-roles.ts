import type { AdminRoleName } from "@prisma/client";

/** Roles a store manager may assign when hiring (not Owner or another Store Manager). */
export const ROLES_HIRABLE_BY_MANAGER: readonly AdminRoleName[] = [
  "EMPLOYEE",
  "FLOOR_SUPERVISOR",
  "CASH_POS_USER",
  "ADMIN_SUPPORT",
];

export const ALL_ASSIGNABLE_ROLES: readonly AdminRoleName[] = [
  "STORE_MANAGER",
  "EMPLOYEE",
  "FLOOR_SUPERVISOR",
  "CASH_POS_USER",
  "ADMIN_SUPPORT",
];

export function canAssignRole(actorRole: AdminRoleName, targetRole: AdminRoleName): boolean {
  if (targetRole === "OWNER") return false;
  if (actorRole === "OWNER") return true;
  if (actorRole === "STORE_MANAGER") {
    return ROLES_HIRABLE_BY_MANAGER.includes(targetRole);
  }
  return false;
}
