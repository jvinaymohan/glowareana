import { NextRequest, NextResponse } from "next/server";
import { checkInOut } from "@/lib/platform/services/reservations";
import { requirePlatformAdmin } from "@/lib/platform/guards";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await checkInOut({
    actorId: auth.admin.id,
    role: auth.admin.role,
    storeIds: auth.admin.storeIds,
    reservationId: id,
    event: "CHECK_IN",
    note: body.note ? String(body.note) : "",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ reservation: result.reservation });
}
