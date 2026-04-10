import { NextRequest, NextResponse } from "next/server";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

const STATUSES = new Set(Object.values(TicketStatus));
const PRIOS = new Set(Object.values(TicketPriority));

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  const status = request.nextUrl.searchParams.get("status");
  const where: Record<string, unknown> = { storeId };
  if (status && STATUSES.has(status as TicketStatus)) where.status = status;
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 150,
    include: {
      createdBy: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const storeId = String(body.storeId ?? "");
    const subject = String(body.subject ?? "").trim().slice(0, 200);
    const text = String(body.body ?? "").trim().slice(0, 8000);
    if (!storeId || !subject || !text) {
      return NextResponse.json({ error: "storeId, subject, body required" }, { status: 400 });
    }
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
    const st = String(body.status ?? "OPEN");
    const pr = String(body.priority ?? "MEDIUM");
    const ticket = await prisma.supportTicket.create({
      data: {
        storeId,
        subject,
        body: text,
        status: STATUSES.has(st as TicketStatus) ? (st as TicketStatus) : "OPEN",
        priority: PRIOS.has(pr as TicketPriority) ? (pr as TicketPriority) : "MEDIUM",
        createdById: auth.admin.id,
        assigneeId: body.assigneeId ? String(body.assigneeId) : null,
        reservationId: body.reservationId ? String(body.reservationId) : null,
        gameId: body.gameId ? String(body.gameId) : null,
      },
    });
    return NextResponse.json({ ticket });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
