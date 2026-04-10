import { NextRequest, NextResponse } from "next/server";
import { ShiftDutyRole } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { canManageShifts } from "@/lib/platform/admin-capabilities";
import { assertStoreAccess } from "@/lib/platform/rbac";

const DUTY = new Set(Object.values(ShiftDutyRole));

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const mineOnly = request.nextUrl.searchParams.get("mine") === "1";
  const where: Record<string, unknown> = { storeId };
  if (from && to) {
    where.startsAt = { gte: new Date(from), lte: new Date(to) };
  }
  if (mineOnly) {
    where.assignments = { some: { adminUserId: auth.admin.id } };
  }
  const shifts = await prisma.shift.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: {
      assignments: { include: { adminUser: { select: { id: true, name: true, email: true } } } },
    },
    take: 200,
  });
  return NextResponse.json({ shifts });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManageShifts(auth.admin.role)) {
    return NextResponse.json({ error: "Only Owner or Manager can manage shifts" }, { status: 403 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const storeId = String(body.storeId ?? "");
    const startsAt = new Date(String(body.startsAt ?? ""));
    const endsAt = new Date(String(body.endsAt ?? ""));
    if (!storeId || Number.isNaN(+startsAt) || Number.isNaN(+endsAt) || !(startsAt < endsAt)) {
      return NextResponse.json({ error: "storeId, startsAt, endsAt required" }, { status: 400 });
    }
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
    const name = body.name ? String(body.name).slice(0, 120) : null;
    const assignmentsRaw = body.assignments;
    const creates =
      Array.isArray(assignmentsRaw) && assignmentsRaw.length > 0
        ? (assignmentsRaw
            .map((a) => {
              const o = a as Record<string, unknown>;
              const aid = String(o.adminUserId ?? "").trim();
              if (!aid) return null;
              const duty = String(o.dutyRole ?? "GENERAL");
              return {
                adminUserId: aid,
                dutyRole: DUTY.has(duty as ShiftDutyRole) ? (duty as ShiftDutyRole) : "GENERAL",
              };
            })
            .filter(Boolean) as Array<{ adminUserId: string; dutyRole: ShiftDutyRole }>)
        : [];
    const shift = await prisma.shift.create({
      data: {
        storeId,
        startsAt,
        endsAt,
        name,
        createdBy: auth.admin.id,
        ...(creates.length > 0 ? { assignments: { create: creates } } : {}),
      },
      include: { assignments: { include: { adminUser: true } } },
    });
    return NextResponse.json({ shift });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
