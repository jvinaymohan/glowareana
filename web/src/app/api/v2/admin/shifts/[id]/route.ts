import { NextRequest, NextResponse } from "next/server";
import { ShiftDutyRole } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { canManageShifts } from "@/lib/platform/admin-capabilities";
import { assertStoreAccess } from "@/lib/platform/rbac";

const DUTY = new Set(Object.values(ShiftDutyRole));

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManageShifts(auth.admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, shift.storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const startsAt = body.startsAt ? new Date(String(body.startsAt)) : undefined;
    const endsAt = body.endsAt ? new Date(String(body.endsAt)) : undefined;
    if (startsAt && endsAt && !(startsAt < endsAt)) {
      return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
    }
    const name = body.name !== undefined ? String(body.name).slice(0, 120) || null : undefined;

    const assignmentsRaw = body.assignments;
    const shiftUp = await prisma.$transaction(async (tx) => {
      await tx.shift.update({
        where: { id },
        data: {
          ...(startsAt ? { startsAt } : {}),
          ...(endsAt ? { endsAt } : {}),
          ...(name !== undefined ? { name } : {}),
        },
      });
      if (Array.isArray(assignmentsRaw)) {
        await tx.shiftAssignment.deleteMany({ where: { shiftId: id } });
        const creates = (assignmentsRaw as unknown[])
          .map((a) => {
            const o = a as Record<string, unknown>;
            const aid = String(o.adminUserId ?? "").trim();
            if (!aid) return null;
            const duty = String(o.dutyRole ?? "GENERAL");
            return {
              shiftId: id,
              adminUserId: aid,
              dutyRole: DUTY.has(duty as ShiftDutyRole) ? (duty as ShiftDutyRole) : "GENERAL",
            };
          })
          .filter(Boolean) as Array<{ shiftId: string; adminUserId: string; dutyRole: ShiftDutyRole }>;
        if (creates.length) {
          await tx.shiftAssignment.createMany({ data: creates });
        }
      }
      return tx.shift.findUnique({
        where: { id },
        include: { assignments: { include: { adminUser: { select: { id: true, name: true, email: true } } } } },
      });
    });
    return NextResponse.json({ shift: shiftUp });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManageShifts(auth.admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, shift.storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
