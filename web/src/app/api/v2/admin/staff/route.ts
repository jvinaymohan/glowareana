import bcrypt from "bcryptjs";
import { AdminRoleName } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { canManageStaff } from "@/lib/platform/admin-capabilities";
import { assertStoreAccess, canAccessStore } from "@/lib/platform/rbac";
import { canAssignRole } from "@/lib/platform/staff-roles";

const ROLE_SET = new Set<string>(Object.values(AdminRoleName));

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManageStaff(auth.admin.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (auth.admin.role !== "OWNER" && !storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }
  if (storeId) {
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const where =
    storeId != null && storeId !== ""
      ? { stores: { some: { storeId } } }
      : {};

  const staff = await prisma.adminUser.findMany({
    where,
    include: {
      role: { select: { name: true } },
      stores: { include: { store: { select: { id: true, code: true, name: true } } } },
    },
    orderBy: { name: "asc" },
    take: 500,
  });

  return NextResponse.json({
    staff: staff.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      isActive: s.isActive,
      role: s.role.name,
      arenas: s.stores.map((x) => ({
        id: x.store.id,
        code: x.store.code,
        name: x.store.name,
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManageStaff(auth.admin.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const name = String(body.name ?? "").trim().slice(0, 120);
    const password = String(body.password ?? "");
    const roleName = String(body.role ?? body.roleName ?? "").trim() as AdminRoleName;
    const storeIds = Array.isArray(body.storeIds)
      ? (body.storeIds as unknown[]).map((x) => String(x)).filter(Boolean)
      : [];

    if (!email || !name || password.length < 8) {
      return NextResponse.json(
        { error: "email, name, and password (min 8 chars) required" },
        { status: 400 },
      );
    }
    if (!ROLE_SET.has(roleName) || !canAssignRole(auth.admin.role, roleName)) {
      return NextResponse.json({ error: "Invalid or disallowed role" }, { status: 400 });
    }
    if (storeIds.length === 0) {
      return NextResponse.json({ error: "Assign at least one arena (storeIds)" }, { status: 400 });
    }

    for (const sid of storeIds) {
      if (!canAccessStore(auth.admin.role, auth.admin.storeIds, sid)) {
        return NextResponse.json({ error: `No access to arena ${sid}` }, { status: 403 });
      }
    }

    const roleRow = await prisma.role.findUnique({ where: { name: roleName } });
    if (!roleRow) return NextResponse.json({ error: "Role not found" }, { status: 400 });

    const exists = await prisma.adminUser.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.adminUser.create({
      data: {
        email,
        name,
        passwordHash,
        roleId: roleRow.id,
        createdBy: auth.admin.id,
        stores: {
          create: storeIds.map((storeId) => ({
            storeId,
            createdBy: auth.admin.id,
          })),
        },
      },
      include: {
        role: { select: { name: true } },
        stores: { include: { store: { select: { id: true, code: true, name: true } } } },
      },
    });

    return NextResponse.json({
      staff: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        arenas: user.stores.map((x) => x.store),
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
