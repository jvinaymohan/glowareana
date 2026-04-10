import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { canManagePayroll } from "@/lib/platform/admin-capabilities";
import { assertStoreAccess } from "@/lib/platform/rbac";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManagePayroll(auth.admin.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const where: Record<string, unknown> = { storeId };
  if (from && to) {
    where.payPeriodStart = { gte: new Date(from), lte: new Date(to) };
  }

  const rows = await prisma.salary.findMany({
    where,
    orderBy: { payPeriodStart: "desc" },
    take: 200,
    include: { adminUser: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ salaries: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManagePayroll(auth.admin.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const storeId = String(body.storeId ?? "");
    const employeeName = String(body.employeeName ?? "").trim().slice(0, 160);
    const amount = Math.max(0, Math.round(Number(body.amount ?? 0)));
    const payPeriodStart = new Date(String(body.payPeriodStart ?? ""));
    const payPeriodEnd = new Date(String(body.payPeriodEnd ?? ""));
    const adminUserId = body.adminUserId ? String(body.adminUserId) : null;
    const notes = body.notes ? String(body.notes).slice(0, 2000) : null;
    const isRecurring = body.isRecurring !== undefined ? Boolean(body.isRecurring) : false;

    if (!storeId || !employeeName || amount <= 0 || Number.isNaN(+payPeriodStart) || Number.isNaN(+payPeriodEnd)) {
      return NextResponse.json({ error: "storeId, employeeName, amount, payPeriodStart, payPeriodEnd required" }, { status: 400 });
    }
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

    if (adminUserId) {
      const link = await prisma.adminUserStore.findFirst({
        where: { adminUserId, storeId },
      });
      if (!link) {
        return NextResponse.json(
          { error: "Staff member is not assigned to this arena" },
          { status: 400 },
        );
      }
    }

    const row = await prisma.salary.create({
      data: {
        storeId,
        adminUserId,
        employeeName,
        amount,
        payPeriodStart,
        payPeriodEnd,
        isRecurring,
        notes,
        status: "SCHEDULED",
        createdBy: auth.admin.id,
      },
    });
    return NextResponse.json({ salary: row });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
