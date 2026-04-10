import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  /** Line roles see only their punches; managers/supervisors see whole arena unless ?mine=1. */
  const mineOnly =
    auth.admin.role === "EMPLOYEE" ||
    auth.admin.role === "CASH_POS_USER" ||
    request.nextUrl.searchParams.get("mine") === "1";
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const where: Record<string, unknown> = { storeId };
  if (mineOnly) where.adminUserId = auth.admin.id;
  if (from && to) {
    where.clockInAt = { gte: new Date(from), lte: new Date(to) };
  }
  const entries = await prisma.timeClockEntry.findMany({
    where,
    orderBy: { clockInAt: "desc" },
    take: 200,
    include: { adminUser: { select: { id: true, name: true, email: true } } },
  });
  const open = await prisma.timeClockEntry.findFirst({
    where: { storeId, adminUserId: auth.admin.id, clockOutAt: null },
    orderBy: { clockInAt: "desc" },
  });
  return NextResponse.json({ entries, openShift: open });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "in");
    const storeId = String(body.storeId ?? "");
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

    if (action === "in") {
      const existing = await prisma.timeClockEntry.findFirst({
        where: { storeId, adminUserId: auth.admin.id, clockOutAt: null },
      });
      if (existing) {
        return NextResponse.json({ error: "Already clocked in", openShift: existing }, { status: 400 });
      }
      const entry = await prisma.timeClockEntry.create({
        data: {
          storeId,
          adminUserId: auth.admin.id,
          clockInAt: new Date(),
          note: body.note ? String(body.note).slice(0, 500) : null,
        },
      });
      return NextResponse.json({ entry });
    }

    if (action === "out") {
      const open = await prisma.timeClockEntry.findFirst({
        where: { storeId, adminUserId: auth.admin.id, clockOutAt: null },
        orderBy: { clockInAt: "desc" },
      });
      if (!open) return NextResponse.json({ error: "No open shift" }, { status: 400 });
      const entry = await prisma.timeClockEntry.update({
        where: { id: open.id },
        data: {
          clockOutAt: new Date(),
          note:
            body.note != null && String(body.note).trim()
              ? String(open.note ?? "") +
                (open.note ? " · " : "") +
                String(body.note).slice(0, 500)
              : open.note,
        },
      });
      return NextResponse.json({ entry });
    }

    return NextResponse.json({ error: "action must be in or out" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
