/**
 * In-memory sliding-window limiters (per server instance).
 * For multi-instance production, use Redis / Upstash or edge middleware.
 */

const BOOKING_WINDOW_MS = 15 * 60 * 1000;
const MAX_BOOKINGS_PER_WINDOW = 25;

const BIRTHDAY_WINDOW_MS = 60 * 60 * 1000;
const MAX_BIRTHDAY_PER_WINDOW = 12;

const bookingBuckets = new Map<string, number[]>();
const birthdayBuckets = new Map<string, number[]>();
const authBuckets = new Map<string, number[]>();

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const MAX_AUTH_PER_WINDOW = 40;

/** Platform v2 customer reservations (per instance; use Redis in multi-node prod). */
const PLATFORM_V2_BOOKING_WINDOW_MS = 15 * 60 * 1000;
const MAX_PLATFORM_V2_BOOKINGS_PER_WINDOW = 30;
const platformV2BookingBuckets = new Map<string, number[]>();

function prune(now: number, stamps: number[], windowMs: number): number[] {
  return stamps.filter((t) => now - t < windowMs);
}

function allow(
  buckets: Map<string, number[]>,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const recent = prune(now, prev, windowMs);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function allowBookingMutation(clientKey: string): boolean {
  return allow(bookingBuckets, clientKey, MAX_BOOKINGS_PER_WINDOW, BOOKING_WINDOW_MS);
}

export function allowBirthdayMutation(clientKey: string): boolean {
  return allow(
    birthdayBuckets,
    clientKey,
    MAX_BIRTHDAY_PER_WINDOW,
    BIRTHDAY_WINDOW_MS,
  );
}

export function allowAuthAttempt(clientKey: string): boolean {
  return allow(authBuckets, clientKey, MAX_AUTH_PER_WINDOW, AUTH_WINDOW_MS);
}

export function allowPlatformV2BookingMutation(clientKey: string): boolean {
  return allow(
    platformV2BookingBuckets,
    clientKey,
    MAX_PLATFORM_V2_BOOKINGS_PER_WINDOW,
    PLATFORM_V2_BOOKING_WINDOW_MS,
  );
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return `ip:${realIp}`;
  return "ip:unknown";
}
