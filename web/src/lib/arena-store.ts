import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import {
  BIRTHDAY_KID_MAX,
  BIRTHDAY_KID_MIN,
  BIRTHDAY_PREFERRED_MAX_DAYS_AHEAD,
  BIRTHDAY_RETURN_GIFT_PER_CHILD_INR,
} from "@/lib/birthday-config";
import { generateDaySlots, isDateWithinOnlineBookingWindow } from "@/lib/booking";
import type { ComboSize } from "@/lib/combos";
import { computeComboLineItems } from "@/lib/combo-pricing";
import { applyCoupon } from "@/lib/coupons";
import { parseYmd } from "@/lib/date-utils";
import {
  LIMITS,
  sanitizeEmail,
  sanitizeName,
  sanitizeNotes,
  sanitizePhone,
} from "@/lib/input-validation";
import { games } from "@/lib/site";

export type StoredBooking = {
  id: string;
  reference: string;
  createdAt: string;
  date: string;
  gameSlug: string;
  gameTitle: string;
  slotKey: string;
  slotLabel: string;
  kidCount: number;
  subtotalInr: number;
  discountInr: number;
  payableInr: number;
  couponCode: string | null;
  customerName: string;
  phone: string;
  email: string;
  status: "confirmed";
};

export type SlotBlock = {
  id: string;
  createdAt: string;
  date: string;
  gameSlug: string;
  slotKey: string;
  note: string;
};

export type BirthdayPartyRequest = {
  id: string;
  reference: string;
  createdAt: string;
  kidCount: number;
  comboSize: 2 | 3 | 4 | 5;
  gameSlugs: string[];
  gameTitles: string[];
  returnGifts: boolean;
  comboSubtotalPerPersonInr: number;
  comboDiscountPercent: number;
  comboDiscountPerPersonInr: number;
  comboNetPerPersonInr: number;
  comboGroupTotalInr: number;
  returnGiftsFeeInr: number;
  estimatedTotalInr: number;
  customerName: string;
  phone: string;
  email: string;
  preferredDate: string;
  notes: string;
  status: "requested";
  /**
   * When true and preferredDate is set, no public arena slots are bookable that day
   * (birthday party takes precedence over walk-in / online session booking).
   */
  blocksPublicSlots: boolean;
};

export type ArenaStore = {
  bookings: StoredBooking[];
  blocks: SlotBlock[];
  birthdayRequests: BirthdayPartyRequest[];
};

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "arena-store.json");

const empty: ArenaStore = { bookings: [], blocks: [], birthdayRequests: [] };

export function readStore(): ArenaStore {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (!existsSync(STORE_PATH)) {
      writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2), "utf-8");
      return { ...empty, bookings: [], blocks: [], birthdayRequests: [] };
    }
    const raw = readFileSync(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as ArenaStore;
    const rawBirthdays = Array.isArray(
      (parsed as { birthdayRequests?: unknown }).birthdayRequests,
    )
      ? (parsed as ArenaStore).birthdayRequests
      : [];
    const birthdayRequests = rawBirthdays.map((row) => {
      const r = row as BirthdayPartyRequest;
      const hasDate =
        Boolean(r.preferredDate) &&
        /^\d{4}-\d{2}-\d{2}$/.test(r.preferredDate);
      return {
        ...r,
        blocksPublicSlots:
          typeof r.blocksPublicSlots === "boolean"
            ? r.blocksPublicSlots
            : hasDate,
      };
    });
    return {
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
      birthdayRequests,
    };
  } catch {
    return { bookings: [], blocks: [], birthdayRequests: [] };
  }
}

/** Atomic replace to reduce torn writes if the process crashes mid-write. */
export function writeStore(store: ArenaStore): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const json = JSON.stringify(store, null, 2);
  const tmp = join(
    DATA_DIR,
    `.arena-store.${process.pid}.${Date.now()}.tmp`,
  );
  writeFileSync(tmp, json, "utf-8");
  try {
    if (existsSync(STORE_PATH)) unlinkSync(STORE_PATH);
  } catch {
    /* ignore */
  }
  renameSync(tmp, STORE_PATH);
}

export function slotBlocked(
  store: ArenaStore,
  gameSlug: string,
  date: string,
  slotKey: string,
): SlotBlock | undefined {
  return store.blocks.find(
    (b) => b.gameSlug === gameSlug && b.date === date && b.slotKey === slotKey,
  );
}

export function slotBooked(
  store: ArenaStore,
  gameSlug: string,
  date: string,
  slotKey: string,
): StoredBooking | undefined {
  return store.bookings.find(
    (b) =>
      b.gameSlug === gameSlug &&
      b.date === date &&
      b.slotKey === slotKey &&
      b.status === "confirmed",
  );
}

/** True when a birthday party holds the calendar day (all games, all slots). */
export function isDateHeldForBirthdayParty(
  store: ArenaStore,
  date: string,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return store.birthdayRequests.some(
    (r) =>
      r.blocksPublicSlots &&
      r.preferredDate === date &&
      /^\d{4}-\d{2}-\d{2}$/.test(r.preferredDate),
  );
}

export function computeSlotAvailability(
  store: ArenaStore,
  gameSlug: string,
  date: string,
) {
  const slots = generateDaySlots();
  if (isDateHeldForBirthdayParty(store, date)) {
    return slots.map((s) => ({
      key: s.key,
      rangeLabel: s.rangeLabel,
      startLabel: s.startLabel,
      available: false,
      reason: "birthday" as const,
    }));
  }
  return slots.map((s) => {
    const block = slotBlocked(store, gameSlug, date, s.key);
    const booked = slotBooked(store, gameSlug, date, s.key);
    let available = true;
    let reason: null | "blocked" | "booked" = null;
    if (block) {
      available = false;
      reason = "blocked";
    } else if (booked) {
      available = false;
      reason = "booked";
    }
    return {
      key: s.key,
      rangeLabel: s.rangeLabel,
      startLabel: s.startLabel,
      available,
      reason,
    };
  });
}

/**
 * Public booking payload — prices are computed on the server (never trust the client).
 */
export type CreateBookingInput = {
  gameSlug: string;
  date: string;
  slotKey: string;
  kidCount: number;
  couponCode: string | null;
  customerName: string;
  phone: string;
  email: string;
};

export function createBooking(
  input: CreateBookingInput,
): { ok: true; booking: StoredBooking } | { ok: false; error: string } {
  const game = games.find((g) => g.slug === input.gameSlug);
  if (!game) return { ok: false, error: "Invalid game" };

  const validKeys = new Set(generateDaySlots().map((s) => s.key));
  if (!validKeys.has(input.slotKey)) {
    return { ok: false, error: "Invalid time slot" };
  }

  const slotDef = generateDaySlots().find((s) => s.key === input.slotKey);
  if (!slotDef) return { ok: false, error: "Invalid time slot" };

  const kidCount = Math.floor(Number(input.kidCount));
  if (
    !Number.isFinite(kidCount) ||
    kidCount < 1 ||
    kidCount > game.maxKidsPerSession
  ) {
    return {
      ok: false,
      error: `Kids must be between 1 and ${game.maxKidsPerSession} for this game`,
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: "Invalid date" };
  }

  if (!isDateWithinOnlineBookingWindow(input.date)) {
    return {
      ok: false,
      error: "This date is outside the allowed booking window.",
    };
  }

  const nameRes = sanitizeName(input.customerName);
  if (!nameRes.ok) return { ok: false, error: nameRes.error };
  const phoneRes = sanitizePhone(input.phone);
  if (!phoneRes.ok) return { ok: false, error: phoneRes.error };
  const emailRes = sanitizeEmail(input.email);
  if (!emailRes.ok) return { ok: false, error: emailRes.error };

  const subtotalInr = Math.max(0, Math.round(game.priceInr * kidCount));
  let discountInr = 0;
  let couponStored: string | null = null;
  const rawCoupon = input.couponCode?.trim() ?? "";
  if (rawCoupon) {
    const applied = applyCoupon(subtotalInr, rawCoupon);
    if (!applied.ok) return { ok: false, error: applied.error };
    discountInr = applied.discountInr;
    couponStored = applied.code;
  }
  const payableInr = Math.max(0, subtotalInr - discountInr);

  const store = readStore();

  if (isDateHeldForBirthdayParty(store, input.date)) {
    return {
      ok: false,
      error:
        "This date is reserved for a birthday party. Pick another day or contact the arena.",
    };
  }

  if (slotBlocked(store, input.gameSlug, input.date, input.slotKey)) {
    return {
      ok: false,
      error: "This slot is blocked. Choose another time or game.",
    };
  }
  if (slotBooked(store, input.gameSlug, input.date, input.slotKey)) {
    return {
      ok: false,
      error: "This slot was just taken. Please pick another time.",
    };
  }

  const id = crypto.randomUUID();
  const reference = `GA-${id.slice(0, 8).toUpperCase()}`;
  const booking: StoredBooking = {
    id,
    reference,
    createdAt: new Date().toISOString(),
    date: input.date,
    gameSlug: input.gameSlug,
    gameTitle: game.title,
    slotKey: input.slotKey,
    slotLabel: slotDef.rangeLabel,
    kidCount,
    subtotalInr,
    discountInr,
    payableInr,
    couponCode: couponStored,
    customerName: nameRes.value,
    phone: phoneRes.value,
    email: emailRes.value,
    status: "confirmed",
  };

  store.bookings.push(booking);
  writeStore(store);
  return { ok: true, booking };
}

function isBirthdayPreferredDateAllowed(ymd: string): boolean {
  const parsed = parseYmd(ymd);
  if (!parsed) return false;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const last = new Date(start);
  last.setDate(last.getDate() + BIRTHDAY_PREFERRED_MAX_DAYS_AHEAD);
  const d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  if (d < start) return false;
  if (d > last) return false;
  return true;
}

export type CreateBirthdayPartyInput = {
  kidCount: number;
  comboSize: ComboSize;
  gameSlugs: string[];
  returnGifts: boolean;
  customerName: string;
  phone: string;
  email: string;
  preferredDate: string;
  notes: string;
  /**
   * When false, do not block public slots on preferredDate (default: true when date is valid).
   */
  reserveVenueForPublicBooking?: boolean;
};

export function createBirthdayPartyRequest(
  input: CreateBirthdayPartyInput,
):
  | { ok: true; request: BirthdayPartyRequest }
  | { ok: false; error: string } {
  const kidCount = Math.floor(Number(input.kidCount));
  if (
    !Number.isFinite(kidCount) ||
    kidCount < BIRTHDAY_KID_MIN ||
    kidCount > BIRTHDAY_KID_MAX
  ) {
    return {
      ok: false,
      error: `Party size should be ${BIRTHDAY_KID_MIN}–${BIRTHDAY_KID_MAX} kids`,
    };
  }

  const comboSize = input.comboSize;
  if (![2, 3, 4, 5].includes(comboSize)) {
    return { ok: false, error: "Invalid combo size" };
  }

  const slugs = input.gameSlugs.filter(Boolean);
  if (slugs.length !== comboSize) {
    return {
      ok: false,
      error: `Pick exactly ${comboSize} games for this combo`,
    };
  }

  const uniq = new Set(slugs);
  if (uniq.size !== slugs.length) {
    return { ok: false, error: "Each game in the combo must be unique" };
  }

  for (const slug of slugs) {
    if (!games.some((g) => g.slug === slug)) {
      return { ok: false, error: "Invalid game in combo" };
    }
  }

  const lines = computeComboLineItems(slugs, comboSize, kidCount);
  if (!lines.complete) {
    return { ok: false, error: "Combo is incomplete" };
  }

  const nameRes = sanitizeName(input.customerName);
  if (!nameRes.ok) return { ok: false, error: nameRes.error };
  const phoneRes = sanitizePhone(input.phone);
  if (!phoneRes.ok) return { ok: false, error: phoneRes.error };
  const emailRes = sanitizeEmail(input.email);
  if (!emailRes.ok) return { ok: false, error: emailRes.error };

  const returnGifts = Boolean(input.returnGifts);
  const returnGiftsFeeInr = returnGifts
    ? kidCount * BIRTHDAY_RETURN_GIFT_PER_CHILD_INR
    : 0;
  const estimatedTotalInr = lines.groupTotal + returnGiftsFeeInr;

  const id = crypto.randomUUID();
  const reference = `BP-${id.slice(0, 8).toUpperCase()}`;

  const preferredTrimmed = input.preferredDate.trim();
  const hasValidPreferred = /^\d{4}-\d{2}-\d{2}$/.test(preferredTrimmed);
  if (hasValidPreferred && !isBirthdayPreferredDateAllowed(preferredTrimmed)) {
    return {
      ok: false,
      error: "Preferred date must be within the next year and not in the past.",
    };
  }
  const reserveVenue = input.reserveVenueForPublicBooking !== false;
  const blocksPublicSlots = hasValidPreferred && reserveVenue;

  const request: BirthdayPartyRequest = {
    id,
    reference,
    createdAt: new Date().toISOString(),
    kidCount,
    comboSize,
    gameSlugs: slugs,
    gameTitles: lines.selectedGames.map((g) => g.title),
    returnGifts,
    comboSubtotalPerPersonInr: lines.subtotalPerPerson,
    comboDiscountPercent: lines.discountPct,
    comboDiscountPerPersonInr: lines.discountAmountPerPerson,
    comboNetPerPersonInr: lines.totalPerPerson,
    comboGroupTotalInr: lines.groupTotal,
    returnGiftsFeeInr,
    estimatedTotalInr,
    customerName: nameRes.value,
    phone: phoneRes.value,
    email: emailRes.value,
    preferredDate: preferredTrimmed,
    notes: sanitizeNotes(input.notes, LIMITS.notesMax),
    status: "requested",
    blocksPublicSlots,
  };

  const store = readStore();
  store.birthdayRequests.push(request);
  writeStore(store);
  return { ok: true, request };
}

export function setBirthdayPartyPublicSlotHold(
  id: string,
  blocksPublicSlots: boolean,
): { ok: true } | { ok: false; error: string } {
  const store = readStore();
  const r = store.birthdayRequests.find((x) => x.id === id);
  if (!r) return { ok: false, error: "Request not found" };
  if (
    blocksPublicSlots &&
    (!r.preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(r.preferredDate))
  ) {
    return {
      ok: false,
      error: "Add a valid preferred date before enabling venue hold",
    };
  }
  r.blocksPublicSlots = blocksPublicSlots;
  writeStore(store);
  return { ok: true };
}

export function addBlock(input: {
  date: string;
  gameSlug: string;
  slotKey: string;
  note: string;
}): { ok: true; block: SlotBlock } | { ok: false; error: string } {
  const game = games.find((g) => g.slug === input.gameSlug);
  if (!game) return { ok: false, error: "Invalid game" };
  const validKeys = new Set(generateDaySlots().map((s) => s.key));
  if (!validKeys.has(input.slotKey)) {
    return { ok: false, error: "Invalid slot" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: "Invalid date" };
  }

  const store = readStore();
  if (slotBlocked(store, input.gameSlug, input.date, input.slotKey)) {
    return { ok: false, error: "This slot is already blocked" };
  }

  const block: SlotBlock = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    date: input.date,
    gameSlug: input.gameSlug,
    slotKey: input.slotKey,
    note: sanitizeNotes(input.note, LIMITS.blockNoteMax) || "Blocked",
  };
  store.blocks.push(block);
  writeStore(store);
  return { ok: true, block };
}

export function removeBlock(id: string): boolean {
  const store = readStore();
  const before = store.blocks.length;
  store.blocks = store.blocks.filter((b) => b.id !== id);
  if (store.blocks.length === before) return false;
  writeStore(store);
  return true;
}

export function computeStats(store: ArenaStore, from: string, to: string) {
  const inRange = store.bookings.filter(
    (b) => b.date >= from && b.date <= to,
  );
  const totalRevenue = inRange.reduce((s, b) => s + b.payableInr, 0);
  const totalKids = inRange.reduce((s, b) => s + b.kidCount, 0);
  const byDay: Record<
    string,
    { revenue: number; bookings: number; kids: number }
  > = {};
  for (const b of inRange) {
    if (!byDay[b.date])
      byDay[b.date] = { revenue: 0, bookings: 0, kids: 0 };
    byDay[b.date].revenue += b.payableInr;
    byDay[b.date].bookings += 1;
    byDay[b.date].kids += b.kidCount;
  }
  const byGame: Record<string, { revenue: number; bookings: number; kids: number }> =
    {};
  for (const b of inRange) {
    if (!byGame[b.gameSlug])
      byGame[b.gameSlug] = { revenue: 0, bookings: 0, kids: 0 };
    byGame[b.gameSlug].revenue += b.payableInr;
    byGame[b.gameSlug].bookings += 1;
    byGame[b.gameSlug].kids += b.kidCount;
  }
  return {
    totalRevenue,
    bookingCount: inRange.length,
    totalKids,
    byDay,
    byGame,
  };
}
