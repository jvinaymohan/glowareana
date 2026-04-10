import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import {
  addParticipant,
  cancelReservation,
  removeParticipant,
  rescheduleReservation,
} from "@/lib/platform/services/reservations";
import { requirePlatformAdmin } from "@/lib/platform/guards";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const { id } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mode = String(body.mode ?? "");
    if (mode === "reschedule") {
      const result = await rescheduleReservation({
        actorId: auth.admin.id,
        actorType: "ADMIN",
        actorRole: auth.admin.role,
        actorStoreIds: auth.admin.storeIds,
        reservationId: id,
        startsAt: String(body.startsAt ?? ""),
        endsAt: String(body.endsAt ?? ""),
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ reservation: result.reservation });
    }
    if (mode === "add_participant") {
      const result = await addParticipant({
        actorId: auth.admin.id,
        actorType: "ADMIN",
        actorRole: auth.admin.role,
        actorStoreIds: auth.admin.storeIds,
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
        actorId: auth.admin.id,
        actorType: "ADMIN",
        actorRole: auth.admin.role,
        actorStoreIds: auth.admin.storeIds,
        reservationId: id,
        participantId: String(body.participantId ?? ""),
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }
    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        notes: body.notes !== undefined ? String(body.notes) : existing.notes,
        participantCount:
          body.participantCount !== undefined
            ? Math.max(1, Number(body.participantCount))
            : existing.participantCount,
        updatedBy: auth.admin.id,
      },
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
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const { id } = await context.params;
  const result = await cancelReservation({
    actorId: auth.admin.id,
    actorType: "ADMIN",
    actorRole: auth.admin.role,
    actorStoreIds: auth.admin.storeIds,
    reservationId: id,
    note: "Cancelled by admin",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ reservation: result.reservation });
}
