import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";
import { prisma } from "@/lib/platform/prisma";

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
  const [slots, reservations] = await Promise.all([
    prisma.gameSlot.findMany({
      where: { storeId, date: { gte: from, lte: to } },
      include: { game: true },
      orderBy: [{ date: "asc" }, { timeLabel: "asc" }],
    }),
    prisma.reservation.findMany({
      where: { storeId, date: { gte: from, lte: to } },
      select: {
        id: true,
        reference: true,
        gameSlotId: true,
        status: true,
        lifecycle: true,
        bookingChannel: true,
        participantCount: true,
      },
    }),
  ]);
  return NextResponse.json({ slots, reservations });
}
