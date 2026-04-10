import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin, canCalendarMove } from "@/lib/platform/guards";
import { adminMoveReservationToGameSlot } from "@/lib/platform/services/reservations";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canCalendarMove(auth.admin.role)) {
    return NextResponse.json({ error: "Insufficient role to move bookings" }, { status: 403 });
  }
  const { id: reservationId } = await ctx.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const targetGameSlotId = String(body.targetGameSlotId ?? "");
    if (!targetGameSlotId) {
      return NextResponse.json({ error: "targetGameSlotId required" }, { status: 400 });
    }
    const result = await adminMoveReservationToGameSlot({
      actorId: auth.admin.id,
      actorRole: auth.admin.role,
      actorStoreIds: auth.admin.storeIds,
      reservationId,
      targetGameSlotId,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ reservation: result.reservation });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
