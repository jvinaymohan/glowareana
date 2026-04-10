/** Shared pagination and date-range guards for list APIs. */

export function parseLimitOffset(
  searchParams: URLSearchParams,
  defaults: { defaultLimit: number; maxLimit: number },
): { limit: number; offset: number } {
  const rawLimit = Number(searchParams.get("limit"));
  const rawOffset = Number(searchParams.get("offset"));
  const limit = Math.min(
    defaults.maxLimit,
    Math.max(1, Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : defaults.defaultLimit),
  );
  const offset = Math.max(0, Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0);
  return { limit, offset };
}

/** Default admin list window: today → +90 days (covers stress seed horizon). */
export function defaultAdminReservationRange(): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 90);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

const MS_PER_DAY = 86400000;

/** Reject unbounded report windows that load too many rows into memory. */
export function assertReportRangeOk(from: Date, to: Date, maxDays = 120): { ok: true } | { ok: false; error: string } {
  if (from > to) return { ok: false, error: "from must be before to" };
  const days = (to.getTime() - from.getTime()) / MS_PER_DAY;
  if (days > maxDays) {
    return { ok: false, error: `Date range too large (max ${maxDays} days). Narrow from/to or use CSV export.` };
  }
  return { ok: true };
}
