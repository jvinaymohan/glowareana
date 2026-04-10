import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateBookingOperations } from "@/lib/arena-store";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id: bookingId } = await context.params;
  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const actionRaw = String(body.action ?? "").trim();
    const action =
      actionRaw === "check_in" ||
      actionRaw === "check_out" ||
      actionRaw === "reset_visit"
        ? actionRaw
        : undefined;
    const incidentalsInr =
      body.incidentalsInr === undefined ? undefined : Number(body.incidentalsInr);
    const adjustmentInr =
      body.adjustmentInr === undefined ? undefined : Number(body.adjustmentInr);
    const adminNotes =
      body.adminNotes === undefined ? undefined : String(body.adminNotes);

    const result = updateBookingOperations({
      bookingId,
      action,
      incidentalsInr,
      adjustmentInr,
      adminNotes,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ booking: result.booking });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
