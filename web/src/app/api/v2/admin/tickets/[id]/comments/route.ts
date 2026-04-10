import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const { id: ticketId } = await ctx.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const text = String(body.body ?? "").trim().slice(0, 4000);
    if (!text) return NextResponse.json({ error: "body required" }, { status: 400 });
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, ticket.storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
    const comment = await prisma.ticketComment.create({
      data: { ticketId, authorId: auth.admin.id, body: text },
    });
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
