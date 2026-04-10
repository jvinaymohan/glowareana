import type { AdminRoleName } from "@prisma/client";

export function canCalendarDrag(role: AdminRoleName): boolean {
  return (
    role === "OWNER" ||
    role === "STORE_MANAGER" ||
    role === "ADMIN_SUPPORT" ||
    role === "FLOOR_SUPERVISOR"
  );
}

export function canBulkBlockSlots(role: AdminRoleName): boolean {
  return (
    role !== "FLOOR_SUPERVISOR" &&
    role !== "CASH_POS_USER" &&
    role !== "EMPLOYEE"
  );
}

export function canResolveApprovals(role: AdminRoleName): boolean {
  return role === "OWNER" || role === "STORE_MANAGER";
}

export function canManageShifts(role: AdminRoleName): boolean {
  return role === "OWNER" || role === "STORE_MANAGER";
}

/** Hire/update staff and assign arenas (AdminUserStore). */
export function canManageStaff(role: AdminRoleName): boolean {
  return role === "OWNER" || role === "STORE_MANAGER";
}

/** Edit arena game catalog (pricing, capacity, ages) — max 5 active games per store enforced in API. */
export function canManageArenaGames(role: AdminRoleName): boolean {
  return role === "OWNER" || role === "STORE_MANAGER";
}

/** Payroll / salary records for the store. */
export function canManagePayroll(role: AdminRoleName): boolean {
  return role === "OWNER" || role === "STORE_MANAGER";
}

export function canViewTeamTimeClock(role: AdminRoleName): boolean {
  return (
    role === "OWNER" ||
    role === "STORE_MANAGER" ||
    role === "FLOOR_SUPERVISOR" ||
    role === "ADMIN_SUPPORT"
  );
}

export function isOwner(role: AdminRoleName): boolean {
  return role === "OWNER";
}
