import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { canManagePayroll } from "@/lib/platform/admin-capabilities";
import { assertStoreAccess } from "@/lib/platform/rbac";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManagePayroll(auth.admin.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const row = await prisma.salary.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, row.storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data: {
      status?: "SCHEDULED" | "PAID";
      payoutDate?: Date | null;
      amount?: number;
      notes?: string | null;
    } = {};

    if (body.status === "PAID" || body.markPaid === true) {
      data.status = "PAID";
      data.payoutDate = body.payoutDate ? new Date(String(body.payoutDate)) : new Date();
    }
    if (body.status === "SCHEDULED") {
      data.status = "SCHEDULED";
      data.payoutDate = null;
    }
    if (body.amount !== undefined) data.amount = Math.max(0, Math.round(Number(body.amount)));
    if (body.notes !== undefined) data.notes = String(body.notes).slice(0, 2000) || null;

    const updated = await prisma.salary.update({
      where: { id },
      data,
    });
    return NextResponse.json({ salary: updated });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
