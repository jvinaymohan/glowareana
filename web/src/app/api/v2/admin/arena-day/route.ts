import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

/** Today's per-game (arena) slot status for the multi-arena admin grid. */
export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const [games, slots, reservations] = await Promise.all([
    prisma.game.findMany({
      where: { storeId, isActive: true },
      select: { id: true, name: true, maxPerSlot: true },
      orderBy: { name: "asc" },
    }),
    prisma.gameSlot.findMany({
      where: { storeId, date: { gte: from, lte: to } },
      select: { id: true, gameId: true, status: true, availableSlots: true, timeLabel: true },
    }),
    prisma.reservation.findMany({
      where: { storeId, date: { gte: from, lte: to } },
      select: {
        id: true,
        gameSlotId: true,
        reference: true,
        status: true,
        lifecycle: true,
        participantCount: true,
      },
    }),
  ]);

  const resBySlot = new Map<string, (typeof reservations)[number]>();
  for (const r of reservations) {
    if (r.gameSlotId) resBySlot.set(r.gameSlotId, r);
  }

  const arenas = games.map((g, index) => {
    const gSlots = slots.filter((s) => s.gameId === g.id);
    let blocked = 0;
    let booked = 0;
    let available = 0;
    let inUse = 0;
    for (const s of gSlots) {
      if (s.status === "BLOCKED" || s.status === "CLOSED") {
        blocked += 1;
        continue;
      }
      const res = resBySlot.get(s.id);
      if (res) {
        booked += 1;
        if (res.status === "CHECKED_IN" || res.lifecycle === "CHECKED_IN") {
          inUse += 1;
        }
      } else {
        available += 1;
      }
    }
    const label = `Arena ${String.fromCharCode(65 + index)}`;
    return {
      gameId: g.id,
      name: g.name,
      arenaLabel: label,
      slotsToday: gSlots.length,
      blocked,
      booked,
      available,
      inUse,
    };
  });

  return NextResponse.json({ date: from.toISOString().slice(0, 10), arenas });
}
