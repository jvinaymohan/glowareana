import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";
import { prisma } from "@/lib/platform/prisma";

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const idsRaw = body.gameSlotIds;
    const gameSlotId = String(body.gameSlotId ?? "");
    const ids: string[] = Array.isArray(idsRaw)
      ? idsRaw.map((x) => String(x)).filter(Boolean)
      : gameSlotId
        ? [gameSlotId]
        : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "gameSlotId or gameSlotIds required" }, { status: 400 });
    }
    if (auth.admin.role === "FLOOR_SUPERVISOR" || auth.admin.role === "CASH_POS_USER") {
      return NextResponse.json({ error: "Insufficient role for blocking slots" }, { status: 403 });
    }
    const updated: Awaited<ReturnType<typeof prisma.gameSlot.update>>[] = [];
    for (const id of ids) {
      const slot = await prisma.gameSlot.findUnique({ where: { id } });
      if (!slot) return NextResponse.json({ error: `Slot not found: ${id}` }, { status: 404 });
      const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, slot.storeId);
      if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
      updated.push(
        await prisma.gameSlot.update({
          where: { id: slot.id },
          data: {
            status: "BLOCKED",
            lastModifiedBy: auth.admin.id,
          },
        }),
      );
    }
    return NextResponse.json({ slots: updated, count: updated.length });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
