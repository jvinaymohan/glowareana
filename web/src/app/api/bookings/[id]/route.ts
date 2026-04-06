import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth-session";
import { rescheduleBooking } from "@/lib/arena-store";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookingId } = await context.params;
  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const newDate = String(body.date ?? "");
    const newSlotKey = String(body.slotKey ?? "");
    if (!newDate || !newSlotKey) {
      return NextResponse.json(
        { error: "date and slotKey are required" },
        { status: 400 },
      );
    }

    const result = rescheduleBooking({
      bookingId,
      userId,
      newDate,
      newSlotKey,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ booking: result.booking });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
