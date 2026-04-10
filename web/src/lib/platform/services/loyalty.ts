import { randomBytes } from "node:crypto";
import { DiscountType, LoyaltyTier } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";

/** Visits (check-outs) required to earn a loyalty coupon. */
export const PUNCHES_PER_REWARD = 10;

export function tierForLifetimeVisits(n: number): LoyaltyTier {
  if (n >= 50) return "PLATINUM";
  if (n >= 25) return "GOLD";
  if (n >= 10) return "SILVER";
  return "BRONZE";
}

export type LoyaltySummary = {
  storeId: string;
  punchesOnCard: number;
  punchesToNextReward: number;
  lifetimeCheckouts: number;
  tier: LoyaltyTier;
  tierLabel: string;
  totalRewardsEarned: number;
  lastCheckoutAt: string | null;
  benefits: string[];
  rewards: Array<{
    couponCode: string;
    discountType: string;
    discountValue: number;
    createdAt: string;
    redeemed: boolean;
  }>;
};

const TIER_BENEFITS: Record<LoyaltyTier, string[]> = {
  BRONZE: ["Earn 1 punch per completed visit", `Every ${PUNCHES_PER_REWARD} visits → 10% off coupon`],
  SILVER: ["Priority slot holds (when available)", "Birthday month: extra punch on first visit"],
  GOLD: ["10% off retail add-ons at POS", "Early access to new game slots"],
  PLATINUM: ["15% off one party booking / year (see desk)", "VIP queue on busy weekends"],
};

export async function getLoyaltySummaryForUser(
  userId: string,
  storeId: string,
): Promise<LoyaltySummary> {
  const loyalty = await prisma.userLoyalty.findUnique({
    where: { userId_storeId: { userId, storeId } },
  });
  const rewards = await prisma.loyaltyReward.findMany({
    where: { userId, storeId },
    include: { coupon: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const punchesOnCard = loyalty?.punchesOnCard ?? 0;
  const lifetime = loyalty?.lifetimeCheckouts ?? 0;
  const tier = loyalty?.tier ?? "BRONZE";
  const punchesToNext =
    punchesOnCard >= PUNCHES_PER_REWARD ? 0 : PUNCHES_PER_REWARD - punchesOnCard;

  return {
    storeId,
    punchesOnCard,
    punchesToNextReward: punchesToNext,
    lifetimeCheckouts: lifetime,
    tier,
    tierLabel: tier.charAt(0) + tier.slice(1).toLowerCase(),
    totalRewardsEarned: loyalty?.totalRewardsEarned ?? 0,
    lastCheckoutAt: loyalty?.lastCheckoutAt?.toISOString() ?? null,
    benefits: TIER_BENEFITS[tier] ?? TIER_BENEFITS.BRONZE,
    rewards: rewards.map((r) => ({
      couponCode: r.coupon.code,
      discountType: r.coupon.discountType,
      discountValue: r.coupon.discountValue,
      createdAt: r.createdAt.toISOString(),
      redeemed: r.coupon.usedCount > 0 || r.redeemedAt != null,
    })),
  };
}

/**
 * Call when a customer's reservation is checked out (completed visit).
 * Idempotent per reservation.
 */
export async function recordLoyaltyCheckout(input: {
  userId: string;
  storeId: string;
  reservationId: string;
}): Promise<{ ok: true; rewardIssued?: boolean; couponCode?: string } | { ok: false; error: string }> {
  const dup = await prisma.loyaltyEvent.findFirst({
    where: {
      userId: input.userId,
      reservationId: input.reservationId,
      kind: "CHECK_OUT_VISIT",
    },
  });
  if (dup) return { ok: true };

  const result = await prisma.$transaction(async (tx) => {
    const prev = await tx.userLoyalty.findUnique({
      where: { userId_storeId: { userId: input.userId, storeId: input.storeId } },
    });
    const nextLifetime = (prev?.lifetimeCheckouts ?? 0) + 1;
    const nextPunchCount = (prev?.punchesOnCard ?? 0) + 1;
    const tier = tierForLifetimeVisits(nextLifetime);
    let punchesOnCard = nextPunchCount;
    let rewardIssued = false;
    let couponCode: string | undefined;

    if (nextPunchCount >= PUNCHES_PER_REWARD) {
      punchesOnCard = 0;
      rewardIssued = true;
      couponCode = `LOY-${randomBytes(8).toString("hex").toUpperCase()}`;
      const coupon = await tx.coupon.create({
        data: {
          storeId: input.storeId,
          code: couponCode,
          discountType: DiscountType.PERCENT,
          discountValue: 10,
          maxDiscountAmount: 5000,
          usageLimit: 1,
          usedCount: 0,
          state: "ACTIVE",
          expiresAt: new Date(Date.now() + 90 * 86400000),
          createdBy: "loyalty-engine",
        },
      });
      await tx.loyaltyReward.create({
        data: {
          userId: input.userId,
          storeId: input.storeId,
          couponId: coupon.id,
          reservationId: input.reservationId,
        },
      });
    }

    await tx.userLoyalty.upsert({
      where: { userId_storeId: { userId: input.userId, storeId: input.storeId } },
      create: {
        userId: input.userId,
        storeId: input.storeId,
        punchesOnCard,
        lifetimeCheckouts: nextLifetime,
        tier,
        totalRewardsEarned: rewardIssued ? 1 : 0,
        lastCheckoutAt: new Date(),
      },
      update: {
        punchesOnCard,
        lifetimeCheckouts: nextLifetime,
        tier,
        lastCheckoutAt: new Date(),
        ...(rewardIssued ? { totalRewardsEarned: { increment: 1 } } : {}),
      },
    });

    await tx.loyaltyEvent.create({
      data: {
        userId: input.userId,
        storeId: input.storeId,
        reservationId: input.reservationId,
        kind: "CHECK_OUT_VISIT",
        punchAfter: punchesOnCard,
        metaJson: rewardIssued ? JSON.stringify({ couponCode }) : null,
      },
    });

    return { rewardIssued, couponCode };
  });

  return { ok: true, rewardIssued: result.rewardIssued, couponCode: result.couponCode };
}
