import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

/** Slots + reservations in a date range for the interactive admin calendar. */
export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  const from = fromParam ? new Date(fromParam) : new Date();
  from.setHours(0, 0, 0, 0);
  const to = toParam ? new Date(toParam) : new Date(from.getTime() + 6 * 86400000);
  to.setHours(23, 59, 59, 999);

  const [slots, reservations] = await Promise.all([
    prisma.gameSlot.findMany({
      where: { storeId, date: { gte: from, lte: to } },
      include: { game: { select: { id: true, name: true, durationMin: true } } },
      orderBy: [{ date: "asc" }, { timeLabel: "asc" }],
    }),
    prisma.reservation.findMany({
      where: { storeId, date: { gte: from, lte: to } },
      select: {
        id: true,
        reference: true,
        gameSlotId: true,
        startAt: true,
        endAt: true,
        status: true,
        lifecycle: true,
        participantCount: true,
        reservationUsers: { select: { name: true }, take: 1 },
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return NextResponse.json({ from: from.toISOString(), to: to.toISOString(), slots, reservations });
}
