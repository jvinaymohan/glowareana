import bcrypt from "bcryptjs";
import { AdminRoleName } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { canManageStaff } from "@/lib/platform/admin-capabilities";
import { canAccessStore } from "@/lib/platform/rbac";
import { canAssignRole } from "@/lib/platform/staff-roles";

const ROLE_SET = new Set<string>(Object.values(AdminRoleName));

function sharesAnyStore(
  staffStoreIds: string[],
  actorRole: AdminRoleName,
  actorStoreIds: string[],
): boolean {
  if (actorRole === "OWNER") return true;
  return staffStoreIds.some((id) => actorStoreIds.includes(id));
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManageStaff(auth.admin.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.adminUser.findUnique({
    where: { id },
    include: { stores: true, role: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const theirStores = existing.stores.map((s) => s.storeId);
  if (!sharesAnyStore(theirStores, auth.admin.role, auth.admin.storeIds)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (body.role !== undefined || body.roleName !== undefined) {
      const roleName = String(body.role ?? body.roleName ?? "").trim() as AdminRoleName;
      if (!ROLE_SET.has(roleName) || !canAssignRole(auth.admin.role, roleName)) {
        return NextResponse.json({ error: "Invalid or disallowed role" }, { status: 400 });
      }
      const roleRow = await prisma.role.findUnique({ where: { name: roleName } });
      if (!roleRow) return NextResponse.json({ error: "Role not found" }, { status: 400 });
      await prisma.adminUser.update({
        where: { id },
        data: { roleId: roleRow.id, updatedAt: new Date() },
      });
    }

    if (body.name !== undefined) {
      await prisma.adminUser.update({
        where: { id },
        data: { name: String(body.name).slice(0, 120) },
      });
    }

    if (body.isActive !== undefined) {
      await prisma.adminUser.update({
        where: { id },
        data: { isActive: Boolean(body.isActive) },
      });
    }

    if (body.password !== undefined && String(body.password).length >= 8) {
      const passwordHash = await bcrypt.hash(String(body.password), 10);
      await prisma.adminUser.update({ where: { id }, data: { passwordHash } });
    }

    if (Array.isArray(body.storeIds)) {
      const storeIds = (body.storeIds as unknown[]).map((x) => String(x)).filter(Boolean);
      if (storeIds.length === 0) {
        return NextResponse.json({ error: "At least one arena required" }, { status: 400 });
      }
      for (const sid of storeIds) {
        if (!canAccessStore(auth.admin.role, auth.admin.storeIds, sid)) {
          return NextResponse.json({ error: `No access to arena ${sid}` }, { status: 403 });
        }
      }
      await prisma.$transaction(async (tx) => {
        await tx.adminUserStore.deleteMany({ where: { adminUserId: id } });
        for (const storeId of storeIds) {
          await tx.adminUserStore.create({
            data: { adminUserId: id, storeId, createdBy: auth.admin.id },
          });
        }
      });
    }

    const updated = await prisma.adminUser.findUnique({
      where: { id },
      include: {
        role: { select: { name: true } },
        stores: { include: { store: { select: { id: true, code: true, name: true } } } },
      },
    });
    return NextResponse.json({
      staff: {
        id: updated!.id,
        email: updated!.email,
        name: updated!.name,
        isActive: updated!.isActive,
        role: updated!.role.name,
        arenas: updated!.stores.map((x) => x.store),
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
