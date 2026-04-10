import { NextRequest, NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/platform/guards";
import { rescheduleReservation } from "@/lib/platform/services/reservations";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformUser();
  if (auth.denied) return auth.denied;
  const { id } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await rescheduleReservation({
      actorId: auth.user.id,
      actorType: "CUSTOMER",
      reservationId: id,
      startsAt: String(body.startsAt ?? ""),
      endsAt: String(body.endsAt ?? ""),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ reservation: result.reservation });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
