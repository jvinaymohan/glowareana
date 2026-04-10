import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import {
  defaultAdminReservationRange,
  parseLimitOffset,
} from "@/lib/platform/list-params";
import { createReservation } from "@/lib/platform/services/reservations";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId") ?? undefined;
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  const { limit, offset } = parseLimitOffset(request.nextUrl.searchParams, {
    defaultLimit: 100,
    maxLimit: 500,
  });

  const where: Record<string, unknown> = {};
  if (auth.admin.role !== "OWNER") {
    where.storeId = { in: auth.admin.storeIds };
  } else if (storeId) {
    where.storeId = storeId;
  }

  const { from: defFrom, to: defTo } = defaultAdminReservationRange();
  const from = fromParam ? new Date(fromParam) : defFrom;
  const to = toParam ? new Date(toParam) : defTo;
  where.date = { gte: from, lte: to };

  const [rows, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { reservationUsers: true, payments: true },
      orderBy: { startAt: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.reservation.count({ where }),
  ]);

  return NextResponse.json({
    reservations: rows,
    total,
    limit,
    offset,
    hasMore: offset + rows.length < total,
    range: { from: from.toISOString(), to: to.toISOString() },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createReservation({
      actorId: auth.admin.id,
      actorType: "ADMIN",
      actorRole: auth.admin.role,
      actorStoreIds: auth.admin.storeIds,
      storeId: String(body.storeId ?? ""),
      userId: body.userId ? String(body.userId) : null,
      customerName: String(body.customerName ?? ""),
      startsAt: String(body.startsAt ?? ""),
      endsAt: String(body.endsAt ?? ""),
      participantCount: Number(body.participantCount ?? 1),
      subtotalAmount: Number(body.subtotalAmount ?? 0),
      notes: body.notes ? String(body.notes) : "",
      couponCode: body.couponCode ? String(body.couponCode) : undefined,
      promotionId: body.promotionId ? String(body.promotionId) : undefined,
      gameSlotId: body.gameSlotId ? String(body.gameSlotId) : undefined,
      adults: Number(body.adults ?? 1),
      children: Number(body.children ?? 0),
      ageRange: body.ageRange ? String(body.ageRange) : "",
      safetyConsent:
        body.safetyConsent === undefined ? true : Boolean(body.safetyConsent),
      waiverConsent:
        body.waiverConsent === undefined ? true : Boolean(body.waiverConsent),
      bookingChannel:
        body.bookingChannel === "walkin" ? "walkin" : "online",
      bookingType:
        body.bookingType === "BIRTHDAY"
          ? "BIRTHDAY"
          : body.bookingType === "CORPORATE"
            ? "CORPORATE"
            : "STANDARD",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ reservation: result.reservation });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
