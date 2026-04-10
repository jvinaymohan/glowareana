import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformUser } from "@/lib/platform/guards";
import { addParticipant, cancelReservation, removeParticipant } from "@/lib/platform/services/reservations";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformUser();
  if (auth.denied) return auth.denied;
  const { id } = await context.params;
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation || reservation.userId !== auth.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mode = String(body.mode ?? "");
    if (mode === "add_participant") {
      const result = await addParticipant({
        actorId: auth.user.id,
        actorType: "CUSTOMER",
        reservationId: id,
        name: String(body.name ?? ""),
        email: body.email ? String(body.email) : "",
        phone: body.phone ? String(body.phone) : "",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }
    if (mode === "remove_participant") {
      const result = await removeParticipant({
        actorId: auth.user.id,
        actorType: "CUSTOMER",
        reservationId: id,
        participantId: String(body.participantId ?? ""),
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }
    const updated = await prisma.reservation.update({
      where: { id },
      data: { notes: body.notes ? String(body.notes) : reservation.notes, updatedBy: auth.user.id },
    });
    return NextResponse.json({ reservation: updated });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformUser();
  if (auth.denied) return auth.denied;
  const { id } = await context.params;
  const result = await cancelReservation({
    actorId: auth.user.id,
    actorType: "CUSTOMER",
    reservationId: id,
    note: "Cancelled by customer",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
