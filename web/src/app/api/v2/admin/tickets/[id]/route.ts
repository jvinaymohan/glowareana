import { NextRequest, NextResponse } from "next/server";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

const STATUSES = new Set(Object.values(TicketStatus));
const PRIOS = new Set(Object.values(TicketPriority));

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const { id } = await ctx.params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
      createdBy: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, ticket.storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  return NextResponse.json({ ticket });
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const { id } = await ctx.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, ticket.storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
    const st = body.status ? String(body.status) : undefined;
    const pr = body.priority ? String(body.priority) : undefined;
    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(st && STATUSES.has(st as TicketStatus) ? { status: st as TicketStatus } : {}),
        ...(pr && PRIOS.has(pr as TicketPriority) ? { priority: pr as TicketPriority } : {}),
        ...(body.assigneeId !== undefined
          ? { assigneeId: body.assigneeId ? String(body.assigneeId) : null }
          : {}),
        ...(st === "CLOSED" || st === "RESOLVED"
          ? { closedAt: ticket.closedAt ?? new Date() }
          : {}),
      },
    });
    return NextResponse.json({ ticket: updated });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
