import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformUser } from "@/lib/platform/guards";
import { parseLimitOffset } from "@/lib/platform/list-params";
import {
  allowPlatformV2BookingMutation,
  clientKeyFromRequest,
} from "@/lib/rate-limit";
import { createReservation } from "@/lib/platform/services/reservations";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformUser();
  if (auth.denied) return auth.denied;
  const { limit, offset } = parseLimitOffset(request.nextUrl.searchParams, {
    defaultLimit: 50,
    maxLimit: 200,
  });

  const where: { userId: string } = { userId: auth.user.id };

  const [rows, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { payments: true, reservationUsers: true, couponUsages: true },
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
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformUser();
  if (auth.denied) return auth.denied;
  const rlKey = `${clientKeyFromRequest(request)}:u:${auth.user.id}`;
  if (!allowPlatformV2BookingMutation(rlKey)) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again later." },
      { status: 429 },
    );
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createReservation({
      actorId: auth.user.id,
      actorType: "CUSTOMER",
      storeId: String(body.storeId ?? ""),
      userId: auth.user.id,
      customerName: String(body.customerName ?? auth.user.name ?? "Customer"),
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
      safetyConsent: Boolean(body.safetyConsent),
      waiverConsent: Boolean(body.waiverConsent),
      bookingChannel: "online",
      bookingType:
        body.bookingType === "BIRTHDAY"
          ? "BIRTHDAY"
          : body.bookingType === "CORPORATE"
            ? "CORPORATE"
            : "STANDARD",
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ reservation: result.reservation });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
