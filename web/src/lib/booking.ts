/** Venue schedule: 15 min play + 5 min reset between groups. */
export const BOOKING_RULES = {
  sessionMinutes: 15,
  resetMinutes: 5,
  dayStart: { hour: 10, minute: 0 },
  /** Last start so session + reset finishes by 8:00 PM close */
  lastSlotStart: { hour: 19, minute: 40 },
} as const;

export function slotIntervalMinutes(): number {
  return BOOKING_RULES.sessionMinutes + BOOKING_RULES.resetMinutes;
}

export type DaySlot = {
  key: string;
  /** e.g. "10:00 AM – 10:15 AM" */
  rangeLabel: string;
  /** Start time only for compact UI */
  startLabel: string;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatTime12h(hour: number, minute: number): string {
  const d = new Date(2000, 0, 1, hour, minute);
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** All start times for one arena lane in a single day. */
export function generateDaySlots(): DaySlot[] {
  const step = slotIntervalMinutes();
  const slots: DaySlot[] = [];
  let h = BOOKING_RULES.dayStart.hour;
  let m = BOOKING_RULES.dayStart.minute;
  const endTotal =
    BOOKING_RULES.lastSlotStart.hour * 60 +
    BOOKING_RULES.lastSlotStart.minute;

  const toTotal = (th: number, tm: number) => th * 60 + tm;

  while (toTotal(h, m) <= endTotal) {
    const endMinTotal = h * 60 + m + BOOKING_RULES.sessionMinutes;
    const eh = Math.floor(endMinTotal / 60) % 24;
    const em = endMinTotal % 60;
    const startLabel = formatTime12h(h, m);
    const endLabel = formatTime12h(eh, em);
    slots.push({
      key: `${pad(h)}:${pad(m)}`,
      startLabel,
      rangeLabel: `${startLabel} – ${endLabel}`,
    });
    const next = h * 60 + m + step;
    h = Math.floor(next / 60) % 24;
    m = next % 60;
  }

  return slots;
}

export function maxSlotsPerLanePerDay(): number {
  return generateDaySlots().length;
}

/** Deterministic mock: some slots show as full for demo (replace with API). */
export function isSlotAvailableMock(
  gameSlug: string,
  dayOffset: number,
  slotKey: string,
): boolean {
  let hash = 0;
  const s = `${gameSlug}|${dayOffset}|${slotKey}`;
  for (let i = 0; i < s.length; i++) {
    hash = (hash + s.charCodeAt(i) * (i + 1)) % 997;
  }
  return hash % 5 !== 0;
}
