import { NextResponse } from "next/server";
import { AdminRoleName } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin, denyIfNotOwner } from "@/lib/platform/guards";
import { PERMISSIONS } from "@/lib/platform/rbac";

const ROLE_ORDER: AdminRoleName[] = [
  "OWNER",
  "STORE_MANAGER",
  "FLOOR_SUPERVISOR",
  "CASH_POS_USER",
  "ADMIN_SUPPORT",
  "EMPLOYEE",
];

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const denied = denyIfNotOwner(auth.admin.role);
  if (denied) return denied;

  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  const matrix = ROLE_ORDER.map((name) => ({
    role: name,
    description: roles.find((r) => r.name === name)?.description ?? null,
    permissions:
      name === "OWNER"
        ? PERMISSIONS.owner
        : name === "STORE_MANAGER"
          ? PERMISSIONS.storeManager
          : name === "EMPLOYEE"
            ? PERMISSIONS.employee
            : name === "FLOOR_SUPERVISOR"
              ? PERMISSIONS.floorSupervisor
              : name === "CASH_POS_USER"
                ? PERMISSIONS.cashPosUser
                : PERMISSIONS.adminSupport,
  }));

  return NextResponse.json({
    matrix,
    note:
      "Permissions are enforced in API routes and UI visibility. Changing a user's role is done via database / future admin user admin UI.",
  });
}
