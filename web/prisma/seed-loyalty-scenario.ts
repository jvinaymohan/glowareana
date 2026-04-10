/**
 * Loyalty + calendar scenario: 100 demo customers, 60 consecutive days with 2–10
 * bookings/day, mix of standard / birthday / corporate, cancellations, reschedules,
 * shift assignments, then loyalty punches for completed visits.
 *
 * Idempotent cleanup: emails *@loyalty.glowarena.test, references RSV-LOY-*,
 * games/slots createdBy loyalty-scenario, shifts createdBy loyalty-scenario.
 *
 * Requires: npm run prisma:seed (store KORA + admin users).
 * Run: npm run prisma:seed:loyalty-scenario
 */
import bcrypt from "bcryptjs";
import {
  BookingLifecycle,
  BookingType,
  PaymentStatus,
  ReservationStatus,
  ShiftDutyRole,
  SlotAccessMode,
} from "@prisma/client";
import { prisma } from "../src/lib/platform/prisma";
import { recordLoyaltyCheckout } from "../src/lib/platform/services/loyalty";

const RNG_SEED = 20260407;
const REF_PREFIX = "RSV-LOY-";
const USER_EMAIL_DOMAIN = "loyalty.glowarena.test";
const DAYS = 60;
const USER_COUNT = 100;

const LOY_GAMES = [
  {
    id: "loy-party-suite",
    name: "Party Suite (loyalty demo)",
    maxPerSlot: 40,
    durationMin: 90,
    ageMin: 3,
    ageMax: 17,
    basePrice: 799,
  },
  {
    id: "loy-arena-a",
    name: "Glow Court A",
    maxPerSlot: 8,
    durationMin: 30,
    ageMin: 5,
    ageMax: 16,
    basePrice: 499,
  },
  {
    id: "loy-arena-b",
    name: "Glow Court B",
    maxPerSlot: 8,
    durationMin: 30,
    ageMin: 5,
    ageMax: 16,
    basePrice: 499,
  },
] as const;

const FIRST_NAMES = [
  "Aarav", "Vihaan", "Aditya", "Ananya", "Diya", "Ishaan", "Kabir", "Kavya", "Meera", "Neha",
  "Pari", "Reyansh", "Saanvi", "Vivaan", "Zara", "Ethan", "Olivia", "Noah", "Emma", "Liam",
  "Ava", "Mason", "Sophia", "Lucas", "Mia", "Arjun", "Riya", "Dev", "Tara", "Rohan",
  "Priya", "Vikram", "Sneha", "Kiran", "Anika", "Hugo", "Ines", "Mateo", "Sofia", "Leo",
  "Amara", "Kai", "Nina", "Omar", "Yara", "Finn", "Mila", "Theo", "Luna", "Ezra",
];
const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Iyer", "Reddy", "Singh", "Kapoor", "Menon", "Nair", "Das",
  "Bose", "Ghosh", "Khan", "Malik", "Sen", "Roy", "Bakshi", "Chopra", "Desai", "Joshi",
  "Smith", "Johnson", "Garcia", "Martinez", "Brown", "Lee", "Walker", "Hall", "Young", "King",
  "Wright", "Scott", "Green", "Adams", "Nelson", "Hill", "Campbell", "Rivera", "Cook", "Brooks",
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function timeBands(): { hour: number; minute: number; label: string }[] {
  const out: { hour: number; minute: number; label: string }[] = [];
  for (let h = 10; h <= 21; h++) {
    for (const m of [0, 30] as const) {
      out.push({
        hour: h,
        minute: m,
        label: `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`,
      });
    }
  }
  return out;
}

function dayStart(anchor: Date, dayOffset: number): Date {
  const d = new Date(anchor);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function slotStart(anchor: Date, dayOffset: number, hour: number, minute: number): Date {
  const d = dayStart(anchor, dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** 60 days ending yesterday (all past) so CHECKED_OUT + loyalty apply cleanly. */
function scenarioAnchor(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1 - (DAYS - 1));
  return d;
}

function pickUserIndex(rng: () => number): number {
  if (rng() < 0.62) {
    return Math.min(USER_COUNT - 1, Math.floor(Math.pow(rng(), 0.85) * 28));
  }
  return Math.floor(rng() * USER_COUNT);
}

type SlotRow = {
  id: string;
  gameId: string;
  durationMin: number;
  maxPerSlot: number;
  basePrice: number;
  startAt: Date;
  partyCapable: boolean;
};

async function cleanupScenario(storeId: string) {
  await prisma.reservation.deleteMany({
    where: { reference: { startsWith: REF_PREFIX } },
  });

  await prisma.gameSlot.deleteMany({
    where: { createdBy: "loyalty-scenario" },
  });
  await prisma.game.deleteMany({
    where: { id: { in: [...LOY_GAMES.map((g) => g.id)] } },
  });

  await prisma.shift.deleteMany({
    where: { storeId, createdBy: "loyalty-scenario" },
  });

  const scenarioUsers = await prisma.user.findMany({
    where: { email: { endsWith: `@${USER_EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  const userIds = scenarioUsers.map((u) => u.id);
  if (userIds.length === 0) return;

  const rewards = await prisma.loyaltyReward.findMany({
    where: { userId: { in: userIds } },
    select: { couponId: true },
  });
  await prisma.loyaltyReward.deleteMany({ where: { userId: { in: userIds } } });
  if (rewards.length) {
    await prisma.coupon.deleteMany({
      where: { id: { in: rewards.map((r) => r.couponId) } },
    });
  }
  await prisma.loyaltyEvent.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.userLoyalty.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function main() {
  const rng = mulberry32(RNG_SEED);
  const store = await prisma.store.findFirst({ where: { code: "KORA" } });
  if (!store) {
    console.error("Store KORA not found. Run npm run prisma:seed first.");
    process.exit(1);
  }

  const admins = await prisma.adminUser.findMany({
    where: { stores: { some: { storeId: store.id } } },
    take: 8,
  });
  if (admins.length === 0) {
    console.error("No admin users linked to KORA. Run npm run prisma:seed first.");
    process.exit(1);
  }

  console.log("Cleaning previous loyalty scenario data…");
  await cleanupScenario(store.id);

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const userIds: string[] = [];

  console.log(`Creating ${USER_COUNT} users @${USER_EMAIL_DOMAIN}…`);
  for (let i = 0; i < USER_COUNT; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const ln = LAST_NAMES[Math.floor((i * 7) % LAST_NAMES.length)]!;
    const email = `loyalty${String(i + 1).padStart(3, "0")}@${USER_EMAIL_DOMAIN}`;
    const u = await prisma.user.create({
      data: {
        email,
        name: `${fn} ${ln}`,
        passwordHash,
        createdBy: "loyalty-scenario",
      },
    });
    userIds.push(u.id);
  }

  for (const g of LOY_GAMES) {
    await prisma.game.create({
      data: {
        id: g.id,
        storeId: store.id,
        name: g.name,
        maxPerSlot: g.maxPerSlot,
        durationMin: g.durationMin,
        ageMin: g.ageMin,
        ageMax: g.ageMax,
        basePrice: g.basePrice,
        isActive: true,
        createdBy: "loyalty-scenario",
      },
    });
  }

  const anchor = scenarioAnchor();
  const bands = timeBands();
  let globalIndex = 0;
  const checkedOutForLoyalty: { userId: string; reservationId: string }[] = [];

  const dutyRoles: ShiftDutyRole[] = [
    ShiftDutyRole.MANAGER_ON_DUTY,
    ShiftDutyRole.FLOOR,
    ShiftDutyRole.CASH_POS,
    ShiftDutyRole.SUPPORT,
    ShiftDutyRole.GENERAL,
  ];

  for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
    const dailyBookings = 2 + Math.floor(rng() * 9);
    const pool: SlotRow[] = [];
    const partyPool: SlotRow[] = [];

    for (const g of LOY_GAMES) {
      for (const b of bands) {
        const startAt = slotStart(anchor, dayOffset, b.hour, b.minute);
        const row = await prisma.gameSlot.create({
          data: {
            storeId: store.id,
            gameId: g.id,
            date: startAt,
            timeLabel: b.label,
            availableSlots: g.maxPerSlot,
            status: "OPEN",
            slotMode: SlotAccessMode.MIXED,
            createdBy: "loyalty-scenario",
          },
        });
        const meta: SlotRow = {
          id: row.id,
          gameId: g.id,
          durationMin: g.durationMin,
          maxPerSlot: g.maxPerSlot,
          basePrice: g.basePrice,
          startAt,
          partyCapable: g.id === "loy-party-suite",
        };
        if (meta.partyCapable) partyPool.push(meta);
        else pool.push(meta);
      }
    }

    const shuffle = <T,>(arr: T[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    shuffle(pool);
    shuffle(partyPool);

    const dayDate = dayStart(anchor, dayOffset);
    const shiftEnd = new Date(dayDate);
    shiftEnd.setHours(22, 0, 0, 0);
    const shift = await prisma.shift.create({
      data: {
        storeId: store.id,
        startsAt: dayDate,
        endsAt: shiftEnd,
        name: `Loyalty scenario — day ${dayOffset + 1}`,
        createdBy: "loyalty-scenario",
      },
    });
    const staffCount = 2 + Math.floor(rng() * 3);
    const usedAdmins = new Set<string>();
    for (let s = 0; s < staffCount; s++) {
      let admin = admins[Math.floor(rng() * admins.length)]!;
      let guard = 0;
      while (usedAdmins.has(admin.id) && guard < 20) {
        admin = admins[Math.floor(rng() * admins.length)]!;
        guard++;
      }
      usedAdmins.add(admin.id);
      await prisma.shiftAssignment.create({
        data: {
          shiftId: shift.id,
          adminUserId: admin.id,
          dutyRole: dutyRoles[s % dutyRoles.length]!,
        },
      });
    }

    for (let k = 0; k < dailyBookings; k++) {
      globalIndex++;
      const ref = `${REF_PREFIX}${String(globalIndex).padStart(5, "0")}`;
      const uIdx = pickUserIndex(rng);
      const userId = userIds[uIdx]!;

      const rollType = rng();
      let bookingType: BookingType = BookingType.STANDARD;
      let participantCount = 2 + Math.floor(rng() * 6);
      let pick: SlotRow | undefined;

      if (rollType < 0.14 && partyPool.length) {
        bookingType = BookingType.BIRTHDAY;
        participantCount = 6 + Math.floor(rng() * 22);
        pick = partyPool.pop();
      } else if (rollType < 0.22 && partyPool.length) {
        bookingType = BookingType.CORPORATE;
        participantCount = 8 + Math.floor(rng() * 18);
        pick = partyPool.pop();
      } else {
        pick = pool.pop();
      }

      if (!pick) {
        console.warn(`Day ${dayOffset + 1}: slot pool exhausted at booking ${globalIndex}`);
        break;
      }

      if (participantCount > pick.maxPerSlot) {
        participantCount = pick.maxPerSlot;
      }

      const endAt = new Date(pick.startAt.getTime() + pick.durationMin * 60 * 1000);
      const subtotal = pick.basePrice * Math.max(1, Math.ceil(participantCount / 2));
      const total = subtotal;
      const gstAmount = Math.round(total * 0.18);

      const fate = rng();
      let status: ReservationStatus = ReservationStatus.CONFIRMED;
      let lifecycle: BookingLifecycle = BookingLifecycle.PAID;
      let paymentStatus: PaymentStatus = PaymentStatus.PAID;
      let paidAmount = total;
      let balanceAmount = 0;

      if (fate < 0.09) {
        status = ReservationStatus.CANCELLED;
        lifecycle = BookingLifecycle.CANCELLED;
        paymentStatus = PaymentStatus.PENDING;
        paidAmount = 0;
        balanceAmount = total;
      } else if (fate < 0.16) {
        status = ReservationStatus.RESCHEDULED;
        lifecycle = BookingLifecycle.PAID;
        paymentStatus = PaymentStatus.PAID;
        paidAmount = total;
        balanceAmount = 0;
      } else if (fate < 0.22) {
        status = ReservationStatus.CHECKED_IN;
        lifecycle = BookingLifecycle.CHECKED_IN;
        paymentStatus = PaymentStatus.PAID;
        paidAmount = total;
        balanceAmount = 0;
      } else if (fate < 0.88) {
        status = ReservationStatus.CHECKED_OUT;
        lifecycle = BookingLifecycle.CHECKED_OUT;
        paymentStatus = PaymentStatus.PAID;
        paidAmount = total;
        balanceAmount = 0;
      } else {
        status = ReservationStatus.CONFIRMED;
        lifecycle = BookingLifecycle.PAID;
        paymentStatus = PaymentStatus.PAID;
        paidAmount = total;
        balanceAmount = 0;
      }

      const res = await prisma.reservation.create({
        data: {
          reference: ref,
          storeId: store.id,
          userId,
          date: pick.startAt,
          startAt: pick.startAt,
          endAt,
          status,
          lifecycle,
          paymentStatus,
          gameSlotId: pick.id,
          adults: Math.max(1, Math.floor(participantCount * 0.45)),
          children: Math.max(0, participantCount - Math.max(1, Math.floor(participantCount * 0.45))),
          ageRange: "6-14",
          safetyConsent: true,
          waiverConsent: true,
          slotMode: SlotAccessMode.MIXED,
          bookingChannel: rng() < 0.18 ? "walkin" : "online",
          bookingType,
          participantCount,
          subtotalAmount: subtotal,
          discountAmount: 0,
          gstRateBps: 1800,
          gstAmount,
          invoiceRef: `INV-LOY-${globalIndex}`,
          taxAmount: 0,
          totalAmount: total,
          paidAmount,
          balanceAmount,
          notes:
            bookingType === BookingType.BIRTHDAY
              ? "Birthday package — loyalty scenario"
              : bookingType === BookingType.CORPORATE
                ? "Corporate block — loyalty scenario"
                : null,
          createdBy: "loyalty-scenario",
          reservationUsers: {
            create: [
              {
                name: `Guest ${globalIndex}`,
                userId,
                createdBy: "loyalty-scenario",
              },
            ],
          },
        },
      });

      await prisma.gameSlot.update({
        where: { id: pick.id },
        data: { availableSlots: { decrement: participantCount } },
      });

      if (status === ReservationStatus.CHECKED_OUT) {
        await prisma.checkInOutEvent.createMany({
          data: [
            {
              reservationId: res.id,
              storeId: store.id,
              type: "CHECK_IN",
              eventAt: pick.startAt,
              createdBy: "loyalty-scenario",
            },
            {
              reservationId: res.id,
              storeId: store.id,
              type: "CHECK_OUT",
              eventAt: endAt,
              createdBy: "loyalty-scenario",
            },
          ],
        });
        checkedOutForLoyalty.push({ userId, reservationId: res.id });
      } else if (status === ReservationStatus.CHECKED_IN) {
        await prisma.checkInOutEvent.create({
          data: {
            reservationId: res.id,
            storeId: store.id,
            type: "CHECK_IN",
            eventAt: pick.startAt,
            createdBy: "loyalty-scenario",
          },
        });
      }
    }
  }

  console.log(`Applying loyalty checkouts for ${checkedOutForLoyalty.length} completed visits…`);
  let rewards = 0;
  for (const row of checkedOutForLoyalty) {
    const r = await recordLoyaltyCheckout({
      userId: row.userId,
      storeId: store.id,
      reservationId: row.reservationId,
    });
    if (r.ok && r.rewardIssued) rewards++;
  }

  const resCount = await prisma.reservation.count({
    where: { reference: { startsWith: REF_PREFIX } },
  });
  const tierMix = await prisma.userLoyalty.groupBy({
    by: ["tier"],
    where: { storeId: store.id },
    _count: true,
  });

  console.log("Loyalty scenario complete.");
  console.log(`  Reservations: ${resCount}`);
  console.log(`  Loyalty coupons issued (10-visit rewards): ${rewards}`);
  console.log(`  Tier distribution:`, tierMix.map((t) => `${t.tier}:${t._count}`).join(", "));
  console.log(`  Sample logins: loyalty001@${USER_EMAIL_DOMAIN} … loyalty100@ (password Password123!)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
