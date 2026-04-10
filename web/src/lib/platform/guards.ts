import { NextResponse } from "next/server";
import type { AdminRoleName } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import {
  canCalendarDrag,
  canResolveApprovals as canResolveApprovalsRole,
  isOwner as isOwnerRole,
} from "@/lib/platform/admin-capabilities";
import { getPlatformAdminSession, getPlatformUserSession } from "@/lib/platform/sessions";

export async function requirePlatformAdmin() {
  const session = await getPlatformAdminSession();
  if (!session) {
    return { denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminUserId },
    include: { role: true, stores: true },
  });
  if (!admin || !admin.isActive) {
    return { denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return {
    denied: null,
    admin: {
      id: admin.id,
      role: admin.role.name,
      storeIds: admin.stores.map((s) => s.storeId),
      name: admin.name,
      email: admin.email,
    },
  };
}

export async function requirePlatformUser() {
  const session = await getPlatformUserSession();
  if (!session) {
    return { denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) {
    return { denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { denied: null, user };
}

export function denyIfNotOwner(role: AdminRoleName) {
  if (!isOwnerRole(role)) {
    return NextResponse.json({ error: "Owner role required" }, { status: 403 });
  }
  return null;
}

export function canResolveApprovals(role: AdminRoleName) {
  return canResolveApprovalsRole(role);
}

export function canCalendarMove(role: AdminRoleName) {
  return canCalendarDrag(role);
}
