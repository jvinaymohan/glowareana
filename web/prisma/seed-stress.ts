/**
 * Stress seed: ~3,000 reservations over 61 days, 5–100/day, parallel games.
 * References: RSV-ST-00001 … (idempotent cleanup by prefix).
 *
 * Run: npm run prisma:seed:stress
 */
import {
  BookingLifecycle,
  BookingType,
  PaymentStatus,
  ReservationStatus,
  SlotAccessMode,
} from "@prisma/client";
import { prisma } from "../src/lib/platform/prisma";

const TOTAL = 3000;
const DAYS = 61;
const RNG_SEED = 42;
const REF_PREFIX = "RSV-ST-";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function computeDailyCounts(total: number, days: number, rng: () => number): number[] {
  const raw: number[] = [];
  const start = new Date(STRESS_ANCHOR);
  for (let d = 0; d < days; d++) {
    const dt = new Date(start);
    dt.setDate(dt.getDate() + d);
    const wd = dt.getDay();
    const weekend = wd === 0 || wd === 6;
    raw.push(35 + (weekend ? 25 : 0) + (rng() * 16 - 8));
  }
  const sumR = raw.reduce((a, b) => a + b, 0);
  const counts = raw.map((r) =>
    Math.max(5, Math.min(100, Math.round((total * r) / sumR))),
  );
  let s = counts.reduce((a, b) => a + b, 0);
  const clamp = (n: number) => Math.max(5, Math.min(100, n));
  let guard = 0;
  while (s !== total && guard < 50000) {
    guard++;
    if (s < total) {
      const i = counts.findIndex((c) => c < 100);
      if (i === -1) break;
      counts[i] = clamp(counts[i] + 1);
      s++;
    } else {
      const i = counts.findIndex((c) => c > 5);
      if (i === -1) break;
      counts[i] = clamp(counts[i] - 1);
      s--;
    }
  }
  if (s !== total) {
    console.warn(`Daily counts sum to ${s}, target ${total} — adjusting last day`);
    counts[days - 1] = clamp(counts[days - 1] + (total - s));
  }
  // Pull a few days down to the minimum band so reports show realistic quiet days.
  const lowIdx: number[] = [];
  for (let i = 0; i < days; i += 9) lowIdx.push(i);
  for (const i of lowIdx) {
    const targetLow = 5 + Math.floor(rng() * 4);
    const delta = counts[i]! - targetLow;
    if (delta <= 0) continue;
    counts[i] = targetLow;
    let red = delta;
    for (let j = 0; j < days && red > 0; j++) {
      if (lowIdx.includes(j)) continue;
      const room = 100 - counts[j]!;
      if (room <= 0) continue;
      const add = Math.min(room, red);
      counts[j]! += add;
      red -= add;
    }
  }
  s = counts.reduce((a, b) => a + b, 0);
  if (s !== total) {
    const diff = total - s;
    const j = counts.indexOf(Math.max(...counts));
    counts[j] = clamp(counts[j]! + diff);
  }
  return counts;
}

/** Tomorrow local midnight as first stress day anchor */
const STRESS_ANCHOR = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
})();

const STRESS_GAMES = [
  {
    id: "stress-party-room",
    name: "Party Room (stress)",
    maxPerSlot: 40,
    durationMin: 60,
    ageMin: 3,
    ageMax: 17,
    basePrice: 699,
  },
  {
    id: "stress-arena-1",
    name: "Arena 1",
    maxPerSlot: 8,
    durationMin: 30,
    ageMin: 5,
    ageMax: 16,
    basePrice: 499,
  },
  {
    id: "stress-arena-2",
    name: "Arena 2",
    maxPerSlot: 8,
    durationMin: 30,
    ageMin: 5,
    ageMax: 16,
    basePrice: 499,
  },
  {
    id: "stress-arena-3",
    name: "Arena 3",
    maxPerSlot: 8,
    durationMin: 30,
    ageMin: 5,
    ageMax: 16,
    basePrice: 499,
  },
  {
    id: "stress-arena-4",
    name: "Arena 4",
    maxPerSlot: 8,
    durationMin: 30,
    ageMin: 5,
    ageMax: 16,
    basePrice: 499,
  },
  {
    id: "stress-arena-5",
    name: "Arena 5",
    maxPerSlot: 8,
    durationMin: 30,
    ageMin: 5,
    ageMax: 16,
    basePrice: 499,
  },
] as const;

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

function dayStart(dayOffset: number): Date {
  const d = new Date(STRESS_ANCHOR);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function slotStart(dayOffset: number, hour: number, minute: number): Date {
  const d = dayStart(dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const rng = mulberry32(RNG_SEED);
  const store = await prisma.store.findFirst({ where: { code: "KORA" } });
  if (!store) {
    console.error("Store KORA not found. Run npm run prisma:seed first.");
    process.exit(1);
  }

  const customer = await prisma.user.findFirst({ where: { email: "customer@glowarena.local" } });

  console.log("Cleaning previous stress data…");
  await prisma.reservation.deleteMany({
    where: { reference: { startsWith: REF_PREFIX } },
  });
  await prisma.gameSlot.deleteMany({
    where: { gameId: { in: [...STRESS_GAMES.map((g) => g.id)] } },
  });
  await prisma.game.deleteMany({
    where: { id: { in: [...STRESS_GAMES.map((g) => g.id)] } },
  });

  console.log("Creating stress games…");
  for (const g of STRESS_GAMES) {
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
        createdBy: "stress-seed",
      },
    });
  }

  const bands = timeBands();
  const dailyCounts = computeDailyCounts(TOTAL, DAYS, rng);
  console.log(
    "Daily counts — min:",
    Math.min(...dailyCounts),
    "max:",
    Math.max(...dailyCounts),
    "sum:",
    dailyCounts.reduce((a, b) => a + b, 0),
  );

  const specialBirthday = new Set([128, 456, 1201, 2400]);
  const specialCorporate = new Set([333, 777, 1890, 2750]);

  let globalIndex = 0;
  const t0 = Date.now();

  for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
    const n = dailyCounts[dayOffset] ?? 0;
    type SlotRow = {
      id: string;
      gameId: string;
      durationMin: number;
      maxPerSlot: number;
      basePrice: number;
      startAt: Date;
      partyOnly: boolean;
    };
    const pool: SlotRow[] = [];
    const partyPool: SlotRow[] = [];

    for (const g of STRESS_GAMES) {
      for (const b of bands) {
        const startAt = slotStart(dayOffset, b.hour, b.minute);
        const row = await prisma.gameSlot.create({
          data: {
            storeId: store.id,
            gameId: g.id,
            date: startAt,
            timeLabel: b.label,
            availableSlots: g.maxPerSlot,
            status: "OPEN",
            slotMode: SlotAccessMode.MIXED,
            createdBy: "stress-seed",
          },
        });
        const meta = {
          id: row.id,
          gameId: g.id,
          durationMin: g.durationMin,
          maxPerSlot: g.maxPerSlot,
          basePrice: g.basePrice,
          startAt,
          partyOnly: g.id === "stress-party-room",
        };
        if (meta.partyOnly) partyPool.push(meta);
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

    for (let k = 0; k < n; k++) {
      globalIndex++;
      const ref = `${REF_PREFIX}${String(globalIndex).padStart(5, "0")}`;
      const isB = specialBirthday.has(globalIndex);
      const isC = specialCorporate.has(globalIndex);
      let bookingType: BookingType = BookingType.STANDARD;
      let participantCount = 2 + Math.floor(rng() * 7);
      let pick: SlotRow | undefined;

      if (isB) {
        bookingType = BookingType.BIRTHDAY;
        participantCount = 5 + Math.floor(rng() * 26);
        pick = partyPool.pop();
      } else if (isC) {
        bookingType = BookingType.CORPORATE;
        participantCount = 5 + Math.floor(rng() * 26);
        pick = partyPool.pop();
      } else {
        pick = pool.pop();
      }

      if (!pick) {
        console.warn(`Day ${dayOffset}: ran out of slots at booking ${globalIndex}`);
        break;
      }

      if (participantCount > pick.maxPerSlot) {
        participantCount = pick.maxPerSlot;
      }

      const endAt = new Date(pick.startAt.getTime() + pick.durationMin * 60 * 1000);
      const subtotal = pick.basePrice * Math.max(1, Math.ceil(participantCount / 2));
      const total = subtotal;
      const gstAmount = Math.round(total * 0.18);

      const rRoll = rng();
      let lifecycle: BookingLifecycle = BookingLifecycle.CREATED;
      let status: ReservationStatus = ReservationStatus.CONFIRMED;
      let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
      let paidAmount = 0;
      let balanceAmount = total;

      if (rRoll < 0.02) {
        status = ReservationStatus.CANCELLED;
        lifecycle = BookingLifecycle.CANCELLED;
        paymentStatus = PaymentStatus.PENDING;
        paidAmount = 0;
        balanceAmount = total;
      } else if (rRoll < 0.12) {
        lifecycle = BookingLifecycle.PAID;
        paymentStatus = PaymentStatus.PAID;
        paidAmount = total;
        balanceAmount = 0;
      } else if (rRoll < 0.16) {
        lifecycle = BookingLifecycle.PAID;
        paymentStatus = PaymentStatus.PARTIAL;
        paidAmount = Math.floor(total * 0.4);
        balanceAmount = total - paidAmount;
      } else if (rRoll < 0.19) {
        status = ReservationStatus.CHECKED_IN;
        lifecycle = BookingLifecycle.CHECKED_IN;
        paymentStatus = PaymentStatus.PAID;
        paidAmount = total;
        balanceAmount = 0;
      } else if (rRoll < 0.21) {
        status = ReservationStatus.CHECKED_OUT;
        lifecycle = BookingLifecycle.CHECKED_OUT;
        paymentStatus = PaymentStatus.PAID;
        paidAmount = total;
        balanceAmount = 0;
      }

      const channelRoll = rng();
      const bookingChannel = channelRoll < 0.12 ? "walkin" : "online";

      await prisma.reservation.create({
        data: {
          reference: ref,
          storeId: store.id,
          userId: customer?.id ?? null,
          date: pick.startAt,
          startAt: pick.startAt,
          endAt,
          status,
          lifecycle,
          paymentStatus,
          gameSlotId: pick.id,
          adults: Math.max(1, Math.floor(participantCount * 0.4)),
          children: Math.max(0, participantCount - Math.max(1, Math.floor(participantCount * 0.4))),
          ageRange: "6-12",
          safetyConsent: true,
          waiverConsent: true,
          slotMode: SlotAccessMode.MIXED,
          bookingChannel,
          bookingType,
          participantCount,
          subtotalAmount: subtotal,
          discountAmount: 0,
          gstRateBps: 1800,
          gstAmount,
          invoiceRef: `INV-ST-${globalIndex}`,
          taxAmount: 0,
          totalAmount: total,
          paidAmount,
          balanceAmount,
          createdBy: "stress-seed",
          reservationUsers: {
            create: [
              {
                name: `Stress Guest ${globalIndex}`,
                userId: customer?.id ?? null,
                createdBy: "stress-seed",
              },
            ],
          },
        },
      });

      await prisma.gameSlot.update({
        where: { id: pick.id },
        data: { availableSlots: { decrement: participantCount } },
      });
    }

    if ((dayOffset + 1) % 10 === 0) {
      console.log(`… day ${dayOffset + 1}/${DAYS} (${Date.now() - t0} ms elapsed)`);
    }
  }

  const finalCount = await prisma.reservation.count({
    where: { reference: { startsWith: REF_PREFIX } },
  });
  console.log(`Stress seed complete: ${finalCount} reservations in ${Date.now() - t0} ms`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
