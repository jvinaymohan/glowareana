import { NextRequest, NextResponse } from "next/server";
import { ApprovalState } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin, canResolveApprovals } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";
import { addPayment } from "@/lib/platform/services/reservations";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canResolveApprovals(auth.admin.role)) {
    return NextResponse.json({ error: "Only Owner or Manager can resolve approvals" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }
    const row = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, row.storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
    if (row.state !== "PENDING") {
      return NextResponse.json({ error: "Request already resolved" }, { status: 400 });
    }
    const state: ApprovalState = action === "approve" ? "APPROVED" : "REJECTED";
    const resolutionNote = body.resolutionNote ? String(body.resolutionNote).slice(0, 2000) : null;

    const executeRefund =
      action === "approve" &&
      row.type === "REFUND" &&
      row.amountCents &&
      row.amountCents > 0 &&
      row.reservationId &&
      (body.executeRefund === true || body.executeRefund === "true");

    if (executeRefund) {
      const pay = await addPayment({
        actorId: auth.admin.id,
        role: auth.admin.role,
        storeIds: auth.admin.storeIds,
        reservationId: row.reservationId!,
        amount: row.amountCents!,
        type: "REFUND",
        status: "PAID",
        method: "approval",
        note: `Approval ${row.id}`,
      });
      if (!pay.ok) {
        return NextResponse.json({ error: pay.error }, { status: 400 });
      }
    }

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        state,
        resolvedById: auth.admin.id,
        resolvedAt: new Date(),
        resolutionNote,
      },
    });

    return NextResponse.json({ approval: updated });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
