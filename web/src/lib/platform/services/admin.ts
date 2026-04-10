import { DiscountType, PromotionState, type AdminRoleName } from "@prisma/client";
import { sanitizeNotes } from "@/lib/input-validation";
import { prisma } from "@/lib/platform/prisma";
import { assertStoreAccess } from "@/lib/platform/rbac";

export async function createCoupon(input: {
  actorId: string;
  role: AdminRoleName;
  storeIds: string[];
  storeId?: string | null;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
}) {
  if (input.role !== "OWNER" && !input.storeId) {
    return { ok: false as const, error: "Store-specific coupon required for this role" };
  }
  if (input.storeId) {
    const access = assertStoreAccess(input.role, input.storeIds, input.storeId);
    if (!access.ok) return access;
  }
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{4,30}$/.test(code)) {
    return { ok: false as const, error: "Invalid coupon code format" };
  }
  if (input.discountValue <= 0) {
    return { ok: false as const, error: "discountValue must be > 0" };
  }
  const coupon = await prisma.coupon.create({
    data: {
      storeId: input.storeId ?? null,
      code,
      discountType: input.discountType,
      discountValue: Math.round(input.discountValue),
      maxDiscountAmount:
        input.maxDiscountAmount === null || input.maxDiscountAmount === undefined
          ? null
          : Math.round(input.maxDiscountAmount),
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      usageLimit: input.usageLimit ?? null,
      createdBy: input.actorId,
    },
  });
  return { ok: true as const, coupon };
}

export async function createPromotion(input: {
  actorId: string;
  role: AdminRoleName;
  storeIds: string[];
  storeId?: string | null;
  name: string;
  startAt: string;
  endAt: string;
  eligibilityRule?: string;
  discountRule: string;
  description?: string;
}) {
  if (input.role !== "OWNER" && !input.storeId) {
    return { ok: false as const, error: "Store-specific promotion required for this role" };
  }
  if (input.storeId) {
    const access = assertStoreAccess(input.role, input.storeIds, input.storeId);
    if (!access.ok) return access;
  }
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (!(startAt < endAt)) {
    return { ok: false as const, error: "Promotion end date must be after start date" };
  }
  const promotion = await prisma.promotion.create({
    data: {
      storeId: input.storeId ?? null,
      name: input.name.trim(),
      description: sanitizeNotes(input.description ?? "", 500),
      startAt,
      endAt,
      eligibilityRule: sanitizeNotes(input.eligibilityRule ?? "", 2000),
      discountRule: sanitizeNotes(input.discountRule, 2000),
      state: startAt > new Date() ? PromotionState.SCHEDULED : PromotionState.ACTIVE,
      createdBy: input.actorId,
    },
  });
  return { ok: true as const, promotion };
}

export async function getDashboardSummary(input: {
  role: AdminRoleName;
  storeIds: string[];
  storeId?: string;
  from: Date;
  to: Date;
}) {
  const storeWhere =
    input.role === "OWNER"
      ? input.storeId
        ? { storeId: input.storeId }
        : {}
      : {
          storeId: input.storeId && input.storeIds.includes(input.storeId)
            ? input.storeId
            : { in: input.storeIds },
        };
  const [
    todayReservations,
    upcomingCheckins,
    checkedIn,
    checkedOut,
    rescheduled,
    outstandingPayments,
    couponUsage,
    promoUsage,
    revenueAgg,
    expensesAgg,
  ] = await Promise.all([
    prisma.reservation.count({
      where: {
        ...storeWhere,
        date: { gte: input.from, lte: input.to },
      },
    }),
    prisma.reservation.count({
      where: {
        ...storeWhere,
        status: "CONFIRMED",
        startAt: { gte: new Date() },
      },
    }),
    prisma.reservation.count({ where: { ...storeWhere, status: "CHECKED_IN" } }),
    prisma.reservation.count({ where: { ...storeWhere, status: "CHECKED_OUT" } }),
    prisma.reservation.count({ where: { ...storeWhere, status: "RESCHEDULED" } }),
    prisma.reservation.aggregate({
      where: { ...storeWhere, balanceAmount: { gt: 0 } },
      _sum: { balanceAmount: true },
    }),
    prisma.couponUsage.count({ where: { ...storeWhere, usedAt: { gte: input.from, lte: input.to } } }),
    prisma.promotionUsage.count({ where: { ...storeWhere, usedAt: { gte: input.from, lte: input.to } } }),
    prisma.payment.aggregate({
      where: {
        ...storeWhere,
        type: { not: "REFUND" },
        paidAt: { gte: input.from, lte: input.to },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { ...storeWhere, expenseDate: { gte: input.from, lte: input.to } },
      _sum: { amount: true },
    }),
  ]);
  const revenue = revenueAgg._sum.amount ?? 0;
  const expenses = expensesAgg._sum.amount ?? 0;
  const grossMargin = revenue - expenses;
  const netMargin = grossMargin;
  return {
    todayReservations,
    upcomingCheckins,
    checkedIn,
    checkedOut,
    rescheduled,
    outstandingPayments: outstandingPayments._sum.balanceAmount ?? 0,
    recentCouponActivity: couponUsage,
    recentPromotionActivity: promoUsage,
    revenue,
    expenses,
    grossMargin,
    netMargin,
  };
}
