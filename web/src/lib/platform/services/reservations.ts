import { randomBytes } from "node:crypto";
import {
  BookingLifecycle,
  DiscountType,
  GameSlotStatus,
  PaymentStatus,
  PaymentType,
  PrismaClient,
  ReservationStatus,
  SlotAccessMode,
  type AdminRoleName,
} from "@prisma/client";
import { sanitizeName, sanitizeNotes } from "@/lib/input-validation";
import { logAudit } from "@/lib/platform/audit";
import { prisma } from "@/lib/platform/prisma";
import { assertStoreAccess } from "@/lib/platform/rbac";
import { recordLoyaltyCheckout } from "@/lib/platform/services/loyalty";
import { computeSlotBookingSubtotalInr } from "@/lib/platform/services/pricing";

type DbLike = Pick<PrismaClient, "reservation">;

async function allocateReservationReference(tx: DbLike): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const ref = `RSV-${randomBytes(6).toString("hex").toUpperCase()}`;
    const exists = await tx.reservation.findUnique({
      where: { reference: ref },
      select: { id: true },
    });
    if (!exists) return ref;
  }
  throw new Error("Could not allocate a unique booking reference");
}

function computeDiscount(
  subtotal: number,
  coupon?: { discountType: DiscountType; discountValue: number; maxDiscountAmount: number | null },
) {
  if (!coupon) return 0;
  if (coupon.discountType === "PERCENT") {
    const raw = Math.floor((subtotal * coupon.discountValue) / 100);
    return Math.min(raw, coupon.maxDiscountAmount ?? raw);
  }
  return Math.min(subtotal, coupon.discountValue);
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Conflicts when time overlaps AND either:
 * - both reservations use the same gameSlotId (same bookable unit), or
 * - either side has no gameSlotId (legacy store-wide exclusivity).
 * Different game slots may overlap in wall-clock time (parallel games/rooms).
 */
/** Active holds on inventory: excludes cancelled and completed check-outs. */
const CONFLICT_STATUSES: ReservationStatus[] = [
  "CONFIRMED",
  "CHECKED_IN",
  "RESCHEDULED",
];

async function assertNoConflict(
  db: DbLike,
  storeId: string,
  startAt: Date,
  endAt: Date,
  gameSlotId: string | null | undefined,
  excludeId?: string,
) {
  const others = await db.reservation.findMany({
    where: {
      storeId,
      status: { in: CONFLICT_STATUSES },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, reference: true, gameSlotId: true, startAt: true, endAt: true },
  });
  for (const o of others) {
    if (!intervalsOverlap(startAt, endAt, o.startAt, o.endAt)) continue;
    const mine = gameSlotId ?? null;
    const theirs = o.gameSlotId ?? null;
    if (mine && theirs && mine === theirs) {
      return { ok: false as const, error: `Slot conflict with ${o.reference}` };
    }
    if (!mine || !theirs) {
      return { ok: false as const, error: `Slot conflict with ${o.reference}` };
    }
  }
  return { ok: true as const };
}

export async function createReservation(input: {
  actorId: string;
  actorType: "ADMIN" | "CUSTOMER";
  actorRole?: AdminRoleName;
  actorStoreIds?: string[];
  storeId: string;
  userId?: string | null;
  customerName: string;
  startsAt: string;
  endsAt: string;
  participantCount: number;
  subtotalAmount: number;
  notes?: string;
  couponCode?: string;
  promotionId?: string;
  gameSlotId?: string;
  adults?: number;
  children?: number;
  ageRange?: string;
  safetyConsent?: boolean;
  waiverConsent?: boolean;
  bookingChannel?: "online" | "walkin";
  bookingType?: "STANDARD" | "BIRTHDAY" | "CORPORATE";
}) {
  if (input.actorRole) {
    const access = assertStoreAccess(input.actorRole, input.actorStoreIds ?? [], input.storeId);
    if (!access.ok) return access;
  }
  const name = sanitizeName(input.customerName);
  if (!name.ok) return { ok: false as const, error: name.error };
  let startAt = new Date(input.startsAt);
  let endAt = new Date(input.endsAt);
  let slotMode: SlotAccessMode = "MIXED";
  let chosenSlot:
    | null
    | {
        id: string;
        storeId: string;
        status: GameSlotStatus;
        slotMode: SlotAccessMode;
        availableSlots: number;
        game: { maxPerSlot: number; basePrice: number };
      } = null;
  if (input.gameSlotId) {
    const gs = await prisma.gameSlot.findUnique({
      where: { id: input.gameSlotId },
      include: { game: true },
    });
    if (!gs) return { ok: false as const, error: "Invalid game slot" };
    if (gs.storeId !== input.storeId) {
      return { ok: false as const, error: "Game slot does not belong to selected store" };
    }
    if (gs.status !== "OPEN") return { ok: false as const, error: "Selected slot is not open" };
    slotMode = gs.slotMode;
    chosenSlot = {
      id: gs.id,
      storeId: gs.storeId,
      status: gs.status,
      slotMode: gs.slotMode,
      availableSlots: gs.availableSlots,
      game: { maxPerSlot: gs.game.maxPerSlot, basePrice: gs.game.basePrice },
    };
    if (
      (input.bookingChannel ?? "online") === "online" &&
      gs.slotMode === SlotAccessMode.WALK_IN_ONLY
    ) {
      return { ok: false as const, error: "This slot is walk-in only" };
    }
    if (
      (input.bookingChannel ?? "online") === "walkin" &&
      gs.slotMode === SlotAccessMode.ONLINE_ONLY
    ) {
      return { ok: false as const, error: "This slot is online only" };
    }
    startAt = gs.date;
    endAt = new Date(gs.date.getTime() + gs.game.durationMin * 60 * 1000);
  }
  if (!(startAt < endAt)) return { ok: false as const, error: "Invalid reservation time range" };
  const partyType =
    input.bookingType === "BIRTHDAY" || input.bookingType === "CORPORATE";
  const maxPax = partyType ? 60 : 20;
  if (input.participantCount < 1 || input.participantCount > maxPax) {
    return {
      ok: false as const,
      error: `Participants must be between 1 and ${maxPax}${partyType ? " for party bookings" : ""}`,
    };
  }
  if (chosenSlot && input.participantCount > chosenSlot.game.maxPerSlot) {
    return { ok: false as const, error: "Participants exceed game slot limit" };
  }
  if (!input.safetyConsent || !input.waiverConsent) {
    return { ok: false as const, error: "Safety consent and waiver acceptance are required" };
  }
  if (input.actorType === "CUSTOMER" && !input.gameSlotId) {
    return { ok: false as const, error: "Game slot is required for online booking" };
  }
  if (input.actorType === "ADMIN" && !input.gameSlotId) {
    const preConflict = await assertNoConflict(
      prisma,
      input.storeId,
      startAt,
      endAt,
      null,
    );
    if (!preConflict.ok) return preConflict;
  }

  const authoritativeSubtotal = chosenSlot
    ? computeSlotBookingSubtotalInr(chosenSlot.game.basePrice, input.participantCount)
    : Math.max(0, Math.round(input.subtotalAmount));

  if (chosenSlot && input.actorType === "CUSTOMER") {
    const hint = Math.max(0, Math.round(Number(input.subtotalAmount)));
    if (Math.abs(hint - authoritativeSubtotal) > 1) {
      return {
        ok: false as const,
        error: `Price has changed. Expected ₹${authoritativeSubtotal} before discounts. Refresh availability and try again.`,
      };
    }
  }

  const subtotal = authoritativeSubtotal;

  let coupon: null | {
    id: string;
    storeId: string | null;
    state: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    usedCount: number;
    expiresAt: Date | null;
  } = null;
  let promoDiscount = 0;
  let promo: null | { id: string; discountRule: string } = null;
  if (input.couponCode?.trim()) {
    coupon = await prisma.coupon.findUnique({
      where: { code: input.couponCode.trim().toUpperCase() },
      select: {
        id: true,
        storeId: true,
        state: true,
        discountType: true,
        discountValue: true,
        maxDiscountAmount: true,
        usageLimit: true,
        usedCount: true,
        expiresAt: true,
      },
    });
    if (!coupon) return { ok: false as const, error: "Invalid coupon" };
    if (coupon.state !== "ACTIVE") {
      return { ok: false as const, error: "Coupon is not active" };
    }
    if (coupon.storeId && coupon.storeId !== input.storeId) {
      return { ok: false as const, error: "Coupon is not valid for this store" };
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { ok: false as const, error: "Coupon expired" };
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { ok: false as const, error: "Coupon usage limit reached" };
    }
  }
  const discount = computeDiscount(subtotal, coupon ?? undefined);
  if (input.promotionId) {
    const now = new Date();
    const p = await prisma.promotion.findUnique({ where: { id: input.promotionId } });
    if (!p) return { ok: false as const, error: "Invalid promotion" };
    if (p.storeId && p.storeId !== input.storeId) {
      return { ok: false as const, error: "Promotion not valid for this store" };
    }
    if (p.state !== "ACTIVE" || p.startAt > now || p.endAt < now) {
      return { ok: false as const, error: "Promotion inactive" };
    }
    const m = /^PERCENT:(\d{1,2}|100)$/.exec(p.discountRule.trim().toUpperCase());
    if (m) {
      promoDiscount = Math.floor((subtotal * Number(m[1])) / 100);
    } else {
      const f = /^FIXED:(\d+)$/.exec(p.discountRule.trim().toUpperCase());
      if (!f) {
        return { ok: false as const, error: "Unsupported promotion discount rule (use PERCENT:n or FIXED:n)" };
      }
      promoDiscount = Math.min(subtotal, Number(f[1]));
    }
    promo = { id: p.id, discountRule: p.discountRule };
  }
  const totalDiscount = Math.min(subtotal, discount + promoDiscount);
  const total = Math.max(0, subtotal - totalDiscount);

  let reservation;
  try {
    reservation = await prisma.$transaction(async (tx) => {
      if (chosenSlot) {
        const held = await tx.gameSlot.updateMany({
          where: {
            id: chosenSlot.id,
            status: "OPEN",
            availableSlots: { gte: input.participantCount },
          },
          data: { availableSlots: { decrement: input.participantCount } },
        });
        if (held.count !== 1) {
          throw new Error("This slot just sold out. Pick another time.");
        }
      }

      const conflict = await assertNoConflict(
        tx,
        input.storeId,
        startAt,
        endAt,
        chosenSlot?.id ?? input.gameSlotId ?? null,
      );
      if (!conflict.ok) throw new Error(conflict.error);

      if (coupon) {
        const fresh = await tx.coupon.findUnique({
          where: { id: coupon.id },
          select: {
            state: true,
            storeId: true,
            usageLimit: true,
            usedCount: true,
            expiresAt: true,
          },
        });
        if (
          !fresh ||
          fresh.state !== "ACTIVE" ||
          (fresh.storeId && fresh.storeId !== input.storeId) ||
          (fresh.expiresAt && fresh.expiresAt < new Date()) ||
          (fresh.usageLimit !== null && fresh.usedCount >= fresh.usageLimit)
        ) {
          throw new Error("Coupon is no longer valid");
        }
      }

      const reference = await allocateReservationReference(tx);

      const created = await tx.reservation.create({
        data: {
          reference,
          storeId: input.storeId,
          userId: input.userId ?? null,
          date: startAt,
          startAt,
          endAt,
          status: "CONFIRMED",
          lifecycle: BookingLifecycle.CREATED,
          gameSlotId: input.gameSlotId ?? null,
          adults: Math.max(0, Math.round(input.adults ?? 1)),
          children: Math.max(0, Math.round(input.children ?? Math.max(0, input.participantCount - 1))),
          ageRange: sanitizeNotes(input.ageRange ?? "", 80) || null,
          safetyConsent: Boolean(input.safetyConsent),
          waiverConsent: Boolean(input.waiverConsent),
          slotMode,
          bookingChannel: input.bookingChannel ?? "online",
          bookingType: input.bookingType ?? "STANDARD",
          participantCount: input.participantCount,
          subtotalAmount: subtotal,
          discountAmount: totalDiscount,
          gstRateBps: 1800,
          gstAmount: Math.round(total * 0.18),
          invoiceRef: `INV-${Date.now()}`,
          totalAmount: total,
          balanceAmount: total,
          notes: sanitizeNotes(input.notes ?? "", 2000) || null,
          createdBy: input.actorId,
        },
      });
      await tx.reservationUser.create({
        data: {
          reservationId: created.id,
          userId: input.userId ?? null,
          name: name.value,
          createdBy: input.actorId,
        },
      });
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            reservationId: created.id,
            userId: input.userId ?? null,
            storeId: input.storeId,
            discountAmount: discount,
            createdBy: input.actorId,
          },
        });
      }
      if (promo) {
        await tx.promotionUsage.create({
          data: {
            promotionId: promo.id,
            reservationId: created.id,
            userId: input.userId ?? null,
            storeId: input.storeId,
            discountAmount: promoDiscount,
            createdBy: input.actorId,
          },
        });
        await tx.promotion.update({
          where: { id: promo.id },
          data: {
            redemptions: { increment: 1 },
            influencedBookings: { increment: 1 },
            influencedRevenue: { increment: total },
          },
        });
      }
      return created;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Booking failed";
    return { ok: false as const, error: msg };
  }

  await logAudit({
    storeId: reservation.storeId,
    reservationId: reservation.id,
    actorType: input.actorType,
    actorId: input.actorId,
    entityType: "Reservation",
    entityId: reservation.id,
    action: "CREATE",
    after: reservation,
  });
  return { ok: true as const, reservation };
}

export async function rescheduleReservation(input: {
  actorId: string;
  actorType: "ADMIN" | "CUSTOMER";
  actorRole?: AdminRoleName;
  actorStoreIds?: string[];
  reservationId: string;
  startsAt: string;
  endsAt: string;
}) {
  const reservation = await prisma.reservation.findUnique({ where: { id: input.reservationId } });
  if (!reservation) return { ok: false as const, error: "Reservation not found" };
  if (input.actorRole) {
    const access = assertStoreAccess(input.actorRole, input.actorStoreIds ?? [], reservation.storeId);
    if (!access.ok) return access;
  }
  if (!input.actorRole && reservation.userId !== input.actorId) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (
    reservation.status === ReservationStatus.CANCELLED ||
    reservation.status === ReservationStatus.CHECKED_OUT
  ) {
    return { ok: false as const, error: "This reservation can no longer be rescheduled" };
  }
  const startAt = new Date(input.startsAt);
  const endAt = new Date(input.endsAt);
  if (!(startAt < endAt)) return { ok: false as const, error: "Invalid reservation time range" };
  if (!input.actorRole && startAt <= new Date()) {
    return { ok: false as const, error: "Reschedule time must be in the future" };
  }
  const conflict = await assertNoConflict(
    prisma,
    reservation.storeId,
    startAt,
    endAt,
    reservation.gameSlotId,
    reservation.id,
  );
  if (!conflict.ok) return conflict;
  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      date: startAt,
      startAt,
      endAt,
      status: "RESCHEDULED",
      updatedBy: input.actorId,
    },
  });
  await logAudit({
    storeId: updated.storeId,
    reservationId: updated.id,
    actorType: input.actorType,
    actorId: input.actorId,
    entityType: "Reservation",
    entityId: updated.id,
    action: "RESCHEDULE",
    before: reservation,
    after: updated,
  });
  return { ok: true as const, reservation: updated };
}

export async function addParticipant(input: {
  actorId: string;
  actorType: "ADMIN" | "CUSTOMER";
  actorRole?: AdminRoleName;
  actorStoreIds?: string[];
  reservationId: string;
  name: string;
  email?: string;
  phone?: string;
}) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: input.reservationId },
    include: { reservationUsers: true },
  });
  if (!reservation) return { ok: false as const, error: "Reservation not found" };
  if (input.actorRole) {
    const access = assertStoreAccess(input.actorRole, input.actorStoreIds ?? [], reservation.storeId);
    if (!access.ok) return access;
  } else if (reservation.userId !== input.actorId) {
    return { ok: false as const, error: "Unauthorized" };
  }
  const name = sanitizeName(input.name);
  if (!name.ok) return { ok: false as const, error: name.error };
  const email = (input.email ?? "").trim().toLowerCase();
  const phone = (input.phone ?? "").trim();
  const duplicate = reservation.reservationUsers.some(
    (u) =>
      (email && u.email?.toLowerCase() === email) ||
      (phone && u.phone?.replace(/\s+/g, "") === phone.replace(/\s+/g, "")),
  );
  if (duplicate) return { ok: false as const, error: "Duplicate participant" };
  const created = await prisma.reservationUser.create({
    data: {
      reservationId: reservation.id,
      name: name.value,
      email: email || null,
      phone: phone || null,
      createdBy: input.actorId,
    },
  });
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { participantCount: reservation.participantCount + 1, updatedBy: input.actorId },
  });
  await logAudit({
    storeId: reservation.storeId,
    reservationId: reservation.id,
    actorType: input.actorType,
    actorId: input.actorId,
    entityType: "ReservationUser",
    entityId: created.id,
    action: "ADD_PARTICIPANT",
    after: created,
  });
  return { ok: true as const, participant: created };
}

export async function removeParticipant(input: {
  actorId: string;
  actorType: "ADMIN" | "CUSTOMER";
  actorRole?: AdminRoleName;
  actorStoreIds?: string[];
  reservationId: string;
  participantId: string;
}) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: input.reservationId },
    include: { reservationUsers: true },
  });
  if (!reservation) return { ok: false as const, error: "Reservation not found" };
  if (input.actorRole) {
    const access = assertStoreAccess(input.actorRole, input.actorStoreIds ?? [], reservation.storeId);
    if (!access.ok) return access;
  } else if (reservation.userId !== input.actorId) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (reservation.reservationUsers.length <= 1) {
    return { ok: false as const, error: "At least one participant is required" };
  }
  const participant = reservation.reservationUsers.find((u) => u.id === input.participantId);
  if (!participant) return { ok: false as const, error: "Participant not found" };
  await prisma.$transaction([
    prisma.reservationUser.delete({ where: { id: participant.id } }),
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { participantCount: Math.max(1, reservation.participantCount - 1), updatedBy: input.actorId },
    }),
  ]);
  await logAudit({
    storeId: reservation.storeId,
    reservationId: reservation.id,
    actorType: input.actorType,
    actorId: input.actorId,
    entityType: "ReservationUser",
    entityId: participant.id,
    action: "REMOVE_PARTICIPANT",
    before: participant,
  });
  return { ok: true as const };
}

export async function checkInOut(input: {
  actorId: string;
  role: AdminRoleName;
  storeIds: string[];
  reservationId: string;
  event: "CHECK_IN" | "CHECK_OUT";
  note?: string;
}) {
  const reservation = await prisma.reservation.findUnique({ where: { id: input.reservationId } });
  if (!reservation) return { ok: false as const, error: "Reservation not found" };
  const access = assertStoreAccess(input.role, input.storeIds, reservation.storeId);
  if (!access.ok) return access;
  if (reservation.status === "CANCELLED") {
    return { ok: false as const, error: "Cannot check in/out cancelled reservation" };
  }
  if (input.event === "CHECK_IN" && reservation.lifecycle === "CHECKED_OUT") {
    return { ok: false as const, error: "Already checked out" };
  }
  if (input.event === "CHECK_OUT" && reservation.lifecycle !== "CHECKED_IN") {
    return { ok: false as const, error: "Check-in required before check-out" };
  }
  if (input.event === "CHECK_IN" && reservation.lifecycle === "CREATED") {
    return { ok: false as const, error: "Reservation must be paid before check-in" };
  }
  const nextStatus = input.event === "CHECK_IN" ? ReservationStatus.CHECKED_IN : ReservationStatus.CHECKED_OUT;
  const nextLifecycle =
    input.event === "CHECK_IN" ? BookingLifecycle.CHECKED_IN : BookingLifecycle.CHECKED_OUT;
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.reservation.update({
      where: { id: reservation.id },
      data: { status: nextStatus, lifecycle: nextLifecycle, updatedBy: input.actorId },
    });
    await tx.checkInOutEvent.create({
      data: {
        reservationId: reservation.id,
        storeId: reservation.storeId,
        type: input.event,
        notes: sanitizeNotes(input.note ?? "", 2000) || null,
        createdBy: input.actorId,
      },
    });
    return row;
  });
  await logAudit({
    storeId: updated.storeId,
    reservationId: updated.id,
    actorType: "ADMIN",
    actorId: input.actorId,
    entityType: "Reservation",
    entityId: updated.id,
    action: input.event,
    before: reservation,
    after: updated,
    note: input.note,
  });
  if (input.event === "CHECK_OUT" && updated.userId) {
    void recordLoyaltyCheckout({
      userId: updated.userId,
      storeId: updated.storeId,
      reservationId: updated.id,
    }).catch(() => {});
  }
  return { ok: true as const, reservation: updated };
}

export async function cancelReservation(input: {
  actorId: string;
  actorType: "ADMIN" | "CUSTOMER";
  actorRole?: AdminRoleName;
  actorStoreIds?: string[];
  reservationId: string;
  note?: string;
}) {
  const reservation = await prisma.reservation.findUnique({ where: { id: input.reservationId } });
  if (!reservation) return { ok: false as const, error: "Reservation not found" };
  if (input.actorRole) {
    const access = assertStoreAccess(input.actorRole, input.actorStoreIds ?? [], reservation.storeId);
    if (!access.ok) return access;
  } else if (reservation.userId !== input.actorId) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (reservation.status === "CANCELLED") return { ok: true as const, reservation };
  const updated = await prisma.$transaction(async (tx) => {
    if (reservation.gameSlotId) {
      await tx.gameSlot.update({
        where: { id: reservation.gameSlotId },
        data: { availableSlots: { increment: reservation.participantCount } },
      });
    }
    return tx.reservation.update({
      where: { id: reservation.id },
      data: { status: "CANCELLED", lifecycle: "CANCELLED", updatedBy: input.actorId },
    });
  });
  await logAudit({
    storeId: updated.storeId,
    reservationId: updated.id,
    actorType: input.actorType,
    actorId: input.actorId,
    entityType: "Reservation",
    entityId: updated.id,
    action: "CANCEL",
    before: reservation,
    after: updated,
    note: input.note,
  });
  return { ok: true as const, reservation: updated };
}

function gameSlotWallTimes(slot: {
  date: Date;
  timeLabel: string;
  game: { durationMin: number };
}): { startAt: Date; endAt: Date } {
  const d = new Date(slot.date);
  const [hStr, mStr] = slot.timeLabel.split(":");
  const h = parseInt(hStr ?? "0", 10) || 0;
  const m = parseInt(mStr ?? "0", 10) || 0;
  const startAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
  const endAt = new Date(startAt.getTime() + slot.game.durationMin * 60 * 1000);
  return { startAt, endAt };
}

export async function adminMoveReservationToGameSlot(input: {
  actorId: string;
  actorRole: AdminRoleName;
  actorStoreIds: string[];
  reservationId: string;
  targetGameSlotId: string;
}) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: input.reservationId },
  });
  if (!reservation) return { ok: false as const, error: "Reservation not found" };
  const access = assertStoreAccess(input.actorRole, input.actorStoreIds, reservation.storeId);
  if (!access.ok) return access;
  if (
    reservation.status === ReservationStatus.CANCELLED ||
    reservation.status === ReservationStatus.CHECKED_OUT
  ) {
    return { ok: false as const, error: "Reservation cannot be moved" };
  }
  const target = await prisma.gameSlot.findUnique({
    where: { id: input.targetGameSlotId },
    include: { game: true },
  });
  if (!target || target.storeId !== reservation.storeId) {
    return { ok: false as const, error: "Invalid target slot" };
  }
  if (target.status !== GameSlotStatus.OPEN) {
    return { ok: false as const, error: "Target slot is not open" };
  }
  if (reservation.gameSlotId === target.id) {
    return { ok: true as const, reservation };
  }
  if (target.availableSlots < reservation.participantCount) {
    return { ok: false as const, error: "Not enough capacity on target slot" };
  }
  const { startAt, endAt } = gameSlotWallTimes(target);
  const conflict = await assertNoConflict(
    prisma,
    reservation.storeId,
    startAt,
    endAt,
    target.id,
    reservation.id,
  );
  if (!conflict.ok) return conflict;

  const updated = await prisma.$transaction(async (tx) => {
    if (reservation.gameSlotId) {
      await tx.gameSlot.update({
        where: { id: reservation.gameSlotId },
        data: { availableSlots: { increment: reservation.participantCount } },
      });
    }
    const dec = await tx.gameSlot.updateMany({
      where: {
        id: target.id,
        status: "OPEN",
        availableSlots: { gte: reservation.participantCount },
      },
      data: { availableSlots: { decrement: reservation.participantCount } },
    });
    if (dec.count !== 1) {
      throw new Error("Target slot no longer has enough capacity");
    }
    return tx.reservation.update({
      where: { id: reservation.id },
      data: {
        gameSlotId: target.id,
        date: startAt,
        startAt,
        endAt,
        status: ReservationStatus.RESCHEDULED,
        updatedBy: input.actorId,
      },
    });
  });
  await logAudit({
    storeId: updated.storeId,
    reservationId: updated.id,
    actorType: "ADMIN",
    actorId: input.actorId,
    entityType: "Reservation",
    entityId: updated.id,
    action: "MOVE_SLOT",
    before: reservation,
    after: updated,
  });
  return { ok: true as const, reservation: updated };
}

export async function addPayment(input: {
  actorId: string;
  role: AdminRoleName;
  storeIds: string[];
  reservationId: string;
  amount: number;
  method?: string;
  type?: PaymentType;
  status?: PaymentStatus;
  note?: string;
  idempotencyKey?: string;
  lineItems?: Array<{ description: string; quantity: number; unitAmount: number }>;
}) {
  const reservation = await prisma.reservation.findUnique({ where: { id: input.reservationId } });
  if (!reservation) return { ok: false as const, error: "Reservation not found" };
  const access = assertStoreAccess(input.role, input.storeIds, reservation.storeId);
  if (!access.ok) return access;
  const payType = input.type ?? "CHARGE";
  let amount = Math.round(input.amount);
  if (input.lineItems?.length && payType !== "REFUND") {
    amount = input.lineItems.reduce(
      (s, li) => s + Math.max(1, Math.round(li.quantity)) * Math.round(li.unitAmount),
      0,
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, error: "Payment amount must be positive" };
  }
  if (payType === "REFUND" && amount > reservation.paidAmount) {
    return { ok: false as const, error: "Refund cannot exceed amount already paid" };
  }
  const idempotencyKey = (input.idempotencyKey ?? "").trim();
  if (idempotencyKey) {
    const existing = await prisma.payment.findUnique({ where: { externalRef: idempotencyKey } });
    if (existing) {
      const currentReservation = await prisma.reservation.findUnique({ where: { id: reservation.id } });
      return {
        ok: true as const,
        payment: existing,
        reservation: currentReservation ?? reservation,
        idempotentReplay: true,
      };
    }
  }
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        reservationId: reservation.id,
        storeId: reservation.storeId,
        type: payType,
        status: input.status ?? "PAID",
        amount,
        method: input.method ?? null,
        currency: "INR",
        razorpayPaymentId:
          input.method?.toLowerCase() === "razorpay"
            ? `razorpay_${Date.now()}`
            : null,
        notes: sanitizeNotes(input.note ?? "", 2000) || null,
        externalRef: idempotencyKey || null,
        capturedAt: new Date(),
        paidAt: new Date(),
        createdBy: input.actorId,
      },
    });
    if (input.lineItems?.length && payType !== "REFUND") {
      await tx.paymentLineItem.createMany({
        data: input.lineItems.map((li) => ({
          paymentId: payment.id,
          description: sanitizeNotes(li.description, 240) || "Line item",
          quantity: Math.max(1, Math.round(li.quantity)),
          unitAmount: Math.round(li.unitAmount),
        })),
      });
    }
    const paidAmount =
      payType === "REFUND"
        ? Math.max(0, reservation.paidAmount - amount)
        : reservation.paidAmount + amount;
    const balance = Math.max(0, reservation.totalAmount - paidAmount);
    const paymentStatus =
      paidAmount === 0
        ? "PENDING"
        : balance > 0
          ? "PARTIAL"
          : "PAID";
    const updated = await tx.reservation.update({
      where: { id: reservation.id },
      data: {
        paidAmount,
        balanceAmount: balance,
        paymentStatus: paymentStatus as PaymentStatus,
        lifecycle:
          paymentStatus === "PAID"
            ? BookingLifecycle.PAID
            : reservation.lifecycle,
        updatedBy: input.actorId,
      },
    });
    return { payment, updated };
  });
  await logAudit({
    storeId: reservation.storeId,
    reservationId: reservation.id,
    actorType: "ADMIN",
    actorId: input.actorId,
    entityType: "Payment",
    entityId: result.payment.id,
    action: "PAYMENT_ADD",
    after: result.payment,
  });
  return { ok: true as const, payment: result.payment, reservation: result.updated };
}
