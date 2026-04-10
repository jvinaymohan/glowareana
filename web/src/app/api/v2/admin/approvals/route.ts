import { NextRequest, NextResponse } from "next/server";
import { ApprovalType } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

const TYPES = new Set(Object.values(ApprovalType));

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId") ?? undefined;
  const state = request.nextUrl.searchParams.get("state") ?? undefined;
  const where: Record<string, unknown> = {};
  if (auth.admin.role === "OWNER") {
    if (storeId) where.storeId = storeId;
  } else {
    where.storeId = storeId && auth.admin.storeIds.includes(storeId) ? storeId : { in: auth.admin.storeIds };
  }
  if (state === "PENDING" || state === "APPROVED" || state === "REJECTED") {
    where.state = state;
  }
  const rows = await prisma.approvalRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ approvals: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const storeId = String(body.storeId ?? "");
    const typeStr = String(body.type ?? "");
    if (!storeId || !TYPES.has(typeStr as ApprovalType)) {
      return NextResponse.json({ error: "storeId and valid type required" }, { status: 400 });
    }
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
    const title = String(body.title ?? "").trim().slice(0, 200);
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    const row = await prisma.approvalRequest.create({
      data: {
        storeId,
        type: typeStr as ApprovalType,
        title,
        notes: body.notes ? String(body.notes).slice(0, 2000) : null,
        payloadJson: body.payloadJson ? String(body.payloadJson).slice(0, 8000) : "{}",
        amountCents:
          body.amountCents !== undefined && body.amountCents !== null
            ? Math.round(Number(body.amountCents))
            : null,
        reservationId: body.reservationId ? String(body.reservationId) : null,
        requestedById: auth.admin.id,
      },
    });
    return NextResponse.json({ approval: row });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
