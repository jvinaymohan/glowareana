import type { AdminRoleName } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";

export function storeWhereForReport(
  role: AdminRoleName,
  storeIds: string[],
  storeId: string | null,
) {
  return role === "OWNER"
    ? storeId
      ? { storeId }
      : {}
    : storeId
      ? { storeId }
      : { storeId: { in: storeIds } };
}

export async function getAdminReportSummary(input: {
  role: AdminRoleName;
  storeIds: string[];
  storeId: string | null;
  from: Date;
  to: Date;
  occupancyRowCap?: number;
}) {
  const cap = input.occupancyRowCap ?? 500;
  const storeWhere = storeWhereForReport(input.role, input.storeIds, input.storeId);
  const from = input.from;
  const to = input.to;

  const [reservations, payments, expenses, checkEvents, couponUsage, promoUsage] =
    await Promise.all([
      prisma.reservation.findMany({
        where: { ...storeWhere, date: { gte: from, lte: to } },
        select: {
          id: true,
          reference: true,
          status: true,
          lifecycle: true,
          bookingType: true,
          participantCount: true,
          totalAmount: true,
          balanceAmount: true,
          storeId: true,
          date: true,
          startAt: true,
          endAt: true,
        },
      }),
      prisma.payment.findMany({
        where: { ...storeWhere, paidAt: { gte: from, lte: to } },
        select: {
          amount: true,
          type: true,
          storeId: true,
          paidAt: true,
          method: true,
        },
      }),
      prisma.expense.findMany({
        where: { ...storeWhere, expenseDate: { gte: from, lte: to } },
        select: { amount: true, category: true, storeId: true, expenseDate: true, title: true },
      }),
      prisma.checkInOutEvent.findMany({
        where: { ...storeWhere, eventAt: { gte: from, lte: to } },
        select: { type: true, storeId: true, eventAt: true },
      }),
      prisma.couponUsage.findMany({
        where: { ...storeWhere, usedAt: { gte: from, lte: to } },
        select: { discountAmount: true, storeId: true, usedAt: true },
      }),
      prisma.promotionUsage.findMany({
        where: { ...storeWhere, usedAt: { gte: from, lte: to } },
        select: { discountAmount: true, storeId: true, usedAt: true },
      }),
    ]);

  const charged = payments.filter((p) => p.type !== "REFUND").reduce((s, p) => s + p.amount, 0);
  const refunded = payments.filter((p) => p.type === "REFUND").reduce((s, p) => s + p.amount, 0);
  const revenue = Math.max(0, charged - refunded);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const grossMargin = revenue - totalExpenses;
  const netMargin = grossMargin;
  const outstanding = reservations.reduce((s, r) => s + r.balanceAmount, 0);
  const occupancyBuckets = new Map<string, { participants: number; sessions: number }>();
  reservations.forEach((r) => {
    const day = r.startAt.toISOString().slice(0, 10);
    const hour = r.startAt.toISOString().slice(11, 13);
    const key = `${day} ${hour}:00`;
    const prev = occupancyBuckets.get(key) ?? { participants: 0, sessions: 0 };
    prev.participants += r.participantCount;
    prev.sessions += 1;
    occupancyBuckets.set(key, prev);
  });
  let occupancyByDayTime = Array.from(occupancyBuckets.entries())
    .map(([bucket, data]) => ({ bucket, sessions: data.sessions, participants: data.participants }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
  const occupancyTruncated = occupancyByDayTime.length > cap;
  if (occupancyTruncated) {
    occupancyByDayTime = occupancyByDayTime.slice(0, cap);
  }
  const revenueByBookingType = reservations.reduce<Record<string, number>>((acc, r) => {
    const key = r.bookingType;
    acc[key] = (acc[key] ?? 0) + r.totalAmount;
    return acc;
  }, {});

  return {
    filters: { storeId: input.storeId, from, to },
    kpis: {
      reservationVolume: reservations.length,
      revenue,
      expenses: totalExpenses,
      grossMargin,
      netMargin,
      outstandingPayments: outstanding,
      couponUsageCount: couponUsage.length,
      promotionUsageCount: promoUsage.length,
      checkInOutActivity: checkEvents.length,
    },
    occupancyByDayTime,
    occupancyTruncated,
    revenueByBookingType,
    reservations,
    payments,
    expenses,
  };
}
