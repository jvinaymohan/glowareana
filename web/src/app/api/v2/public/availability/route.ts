import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get("storeId");
  const dateRaw = request.nextUrl.searchParams.get("date");
  if (!storeId || !dateRaw) {
    return NextResponse.json({ error: "storeId and date are required" }, { status: 400 });
  }
  const day = new Date(dateRaw);
  if (Number.isNaN(day.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const from = new Date(day);
  from.setHours(0, 0, 0, 0);
  const to = new Date(day);
  to.setHours(23, 59, 59, 999);
  const includeStress = request.nextUrl.searchParams.get("includeStress") === "1";
  const slots = await prisma.gameSlot.findMany({
    where: {
      storeId,
      date: { gte: from, lte: to },
      status: "OPEN",
      slotMode: { in: ["MIXED", "ONLINE_ONLY"] },
      availableSlots: { gt: 0 },
      ...(includeStress
        ? {}
        : {
            AND: [
              { gameId: { not: { startsWith: "stress-" } } },
              { gameId: { not: { startsWith: "loy-" } } },
            ],
          }),
    },
    include: { game: true },
    orderBy: [{ date: "asc" }, { timeLabel: "asc" }],
  });
  const byGame = slots.reduce<Record<string, unknown[]>>((acc, s) => {
    const key = s.game.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      gameSlotId: s.id,
      startsAt: s.date,
      time: s.timeLabel,
      durationMin: s.game.durationMin,
      availableSlots: s.availableSlots,
      maxPerSlot: s.game.maxPerSlot,
      ageRange: `${s.game.ageMin}-${s.game.ageMax}`,
      basePrice: s.game.basePrice,
    });
    return acc;
  }, {});
  return NextResponse.json({ date: from.toISOString().slice(0, 10), games: byGame });
}
