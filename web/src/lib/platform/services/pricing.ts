/**
 * Authoritative booking line subtotal in INR (whole rupees, matches DB integers).
 * Uses base game price × participant count (same rule as customer portal availability UI).
 */
export function computeSlotBookingSubtotalInr(basePriceInr: number, participantCount: number): number {
  const p = Math.max(1, Math.floor(participantCount));
  const unit = Math.max(0, Math.round(Number(basePriceInr)));
  return Math.max(0, unit * p);
}
