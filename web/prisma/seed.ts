import bcrypt from "bcryptjs";
import { AdminRoleName, DiscountType } from "@prisma/client";
import { prisma } from "../src/lib/platform/prisma";

async function main() {
  const [ownerRole, managerRole, employeeRole, floorRole, cashRole, supportRole] =
    await Promise.all([
    prisma.role.upsert({
      where: { name: AdminRoleName.OWNER },
      update: {},
      create: { name: AdminRoleName.OWNER, description: "Platform owner" },
    }),
    prisma.role.upsert({
      where: { name: AdminRoleName.STORE_MANAGER },
      update: {},
      create: { name: AdminRoleName.STORE_MANAGER, description: "Store manager" },
    }),
    prisma.role.upsert({
      where: { name: AdminRoleName.EMPLOYEE },
      update: {},
      create: { name: AdminRoleName.EMPLOYEE, description: "Store employee" },
    }),
    prisma.role.upsert({
      where: { name: AdminRoleName.FLOOR_SUPERVISOR },
      update: {},
      create: {
        name: AdminRoleName.FLOOR_SUPERVISOR,
        description: "Floor supervisor",
      },
    }),
    prisma.role.upsert({
      where: { name: AdminRoleName.CASH_POS_USER },
      update: {},
      create: { name: AdminRoleName.CASH_POS_USER, description: "Cash / POS user" },
    }),
    prisma.role.upsert({
      where: { name: AdminRoleName.ADMIN_SUPPORT },
      update: {},
      create: { name: AdminRoleName.ADMIN_SUPPORT, description: "Admin support" },
    }),
  ]);

  const store = await prisma.store.upsert({
    where: { code: "KORA" },
    update: {},
    create: {
      code: "KORA",
      name: "Glow Arena Koramangala",
      timezone: "Asia/Kolkata",
      currency: "INR",
    },
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const owner = await prisma.adminUser.upsert({
    where: { email: "owner@glowarena.local" },
    update: {},
    create: {
      email: "owner@glowarena.local",
      name: "Owner Demo",
      passwordHash,
      roleId: ownerRole.id,
    },
  });

  await prisma.adminUserStore.upsert({
    where: { adminUserId_storeId: { adminUserId: owner.id, storeId: store.id } },
    update: {},
    create: { adminUserId: owner.id, storeId: store.id },
  });

  await prisma.adminUser.upsert({
    where: { email: "manager@glowarena.local" },
    update: {},
    create: {
      email: "manager@glowarena.local",
      name: "Manager Demo",
      passwordHash,
      roleId: managerRole.id,
      stores: { create: [{ storeId: store.id }] },
    },
  });
  await prisma.adminUser.upsert({
    where: { email: "floor@glowarena.local" },
    update: {},
    create: {
      email: "floor@glowarena.local",
      name: "Floor Supervisor Demo",
      passwordHash,
      roleId: floorRole.id,
      stores: { create: [{ storeId: store.id }] },
    },
  });
  await prisma.adminUser.upsert({
    where: { email: "cash@glowarena.local" },
    update: {},
    create: {
      email: "cash@glowarena.local",
      name: "Cash POS Demo",
      passwordHash,
      roleId: cashRole.id,
      stores: { create: [{ storeId: store.id }] },
    },
  });
  await prisma.adminUser.upsert({
    where: { email: "support@glowarena.local" },
    update: {},
    create: {
      email: "support@glowarena.local",
      name: "Admin Support Demo",
      passwordHash,
      roleId: supportRole.id,
      stores: { create: [{ storeId: store.id }] },
    },
  });

  await prisma.adminUser.upsert({
    where: { email: "employee@glowarena.local" },
    update: {},
    create: {
      email: "employee@glowarena.local",
      name: "Employee Demo",
      passwordHash,
      roleId: employeeRole.id,
      stores: { create: [{ storeId: store.id }] },
    },
  });

  const adminglowarenaHash = await bcrypt.hash("FloorisLava#10", 10);
  const adminglowarena = await prisma.adminUser.upsert({
    where: { email: "adminglowarena@glowarena.local" },
    update: {
      passwordHash: adminglowarenaHash,
      name: "Glow Arena Admin",
      roleId: ownerRole.id,
    },
    create: {
      email: "adminglowarena@glowarena.local",
      name: "Glow Arena Admin",
      passwordHash: adminglowarenaHash,
      roleId: ownerRole.id,
    },
  });
  await prisma.adminUserStore.upsert({
    where: {
      adminUserId_storeId: { adminUserId: adminglowarena.id, storeId: store.id },
    },
    update: {},
    create: { adminUserId: adminglowarena.id, storeId: store.id },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@glowarena.local" },
    update: {},
    create: {
      email: "customer@glowarena.local",
      name: "Customer Demo",
      phone: "+919999999999",
      passwordHash,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "DEMO10" },
    update: {},
    create: {
      storeId: store.id,
      code: "DEMO10",
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      usageLimit: 100,
    },
  });

  await prisma.promotion.upsert({
    where: { id: "promo-demo-10" },
    update: {},
    create: {
      id: "promo-demo-10",
      storeId: store.id,
      name: "Demo Week 10%",
      startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      state: "ACTIVE",
      discountRule: "PERCENT:10",
      eligibilityRule: "All bookings",
      description: "Demo promotion",
    },
  });

  await prisma.venue.upsert({
    where: { id: "venue-kora-main" },
    update: {},
    create: {
      id: "venue-kora-main",
      storeId: store.id,
      name: "Main Arena",
      capacity: 30,
      openingHours: "10:00-22:00",
    },
  });
  const lava = await prisma.game.upsert({
    where: { id: "game-lava-kora" },
    update: { sortOrder: 1 },
    create: {
      id: "game-lava-kora",
      storeId: store.id,
      sortOrder: 1,
      name: "Floor is Lava",
      maxPerSlot: 8,
      durationMin: 30,
      ageMin: 5,
      ageMax: 16,
      basePrice: 499,
    },
  });
  const climb = await prisma.game.upsert({
    where: { id: "game-climb-kora" },
    update: { sortOrder: 2 },
    create: {
      id: "game-climb-kora",
      storeId: store.id,
      sortOrder: 2,
      name: "Climb Challenge",
      maxPerSlot: 6,
      durationMin: 30,
      ageMin: 6,
      ageMax: 18,
      basePrice: 449,
    },
  });
  await prisma.game.upsert({
    where: { id: "game-track-kora" },
    update: { sortOrder: 3 },
    create: {
      id: "game-track-kora",
      storeId: store.id,
      sortOrder: 3,
      name: "Speed Track",
      maxPerSlot: 10,
      durationMin: 20,
      ageMin: 5,
      ageMax: 14,
      basePrice: 399,
    },
  });
  await prisma.game.upsert({
    where: { id: "game-studio-kora" },
    update: { sortOrder: 4 },
    create: {
      id: "game-studio-kora",
      storeId: store.id,
      sortOrder: 4,
      name: "Glow Studio",
      maxPerSlot: 12,
      durationMin: 45,
      ageMin: 4,
      ageMax: 12,
      basePrice: 549,
    },
  });
  await prisma.game.upsert({
    where: { id: "game-party-kora" },
    update: { sortOrder: 5 },
    create: {
      id: "game-party-kora",
      storeId: store.id,
      sortOrder: 5,
      name: "Party Arena",
      maxPerSlot: 20,
      durationMin: 60,
      ageMin: 3,
      ageMax: 16,
      basePrice: 899,
    },
  });

  const startAt = new Date();
  startAt.setHours(startAt.getHours() + 2, 0, 0, 0);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
  const timeLabel = startAt.toISOString().slice(11, 16);
  const slotLava = await prisma.gameSlot.upsert({
    where: {
      gameId_date_timeLabel: {
        gameId: lava.id,
        date: startAt,
        timeLabel,
      },
    },
    update: {},
    create: {
      storeId: store.id,
      gameId: lava.id,
      date: startAt,
      timeLabel,
      availableSlots: 12,
      status: "OPEN",
      slotMode: "MIXED",
    },
  });
  await prisma.gameSlot.upsert({
    where: {
      gameId_date_timeLabel: {
        gameId: climb.id,
        date: startAt,
        timeLabel,
      },
    },
    update: {},
    create: {
      storeId: store.id,
      gameId: climb.id,
      date: startAt,
      timeLabel,
      availableSlots: 10,
      status: "OPEN",
      slotMode: "ONLINE_ONLY",
    },
  });

  const existing = await prisma.reservation.findFirst({
    where: { userId: customer.id, storeId: store.id },
  });
  if (!existing) {
    await prisma.reservation.create({
      data: {
        reference: `RSV-DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        storeId: store.id,
        userId: customer.id,
        date: startAt,
        startAt,
        endAt,
        lifecycle: "CREATED",
        gameSlotId: slotLava.id,
        adults: 1,
        children: 1,
        ageRange: "8-12",
        safetyConsent: true,
        waiverConsent: true,
        slotMode: "MIXED",
        bookingChannel: "online",
        participantCount: 2,
        subtotalAmount: 2000,
        discountAmount: 0,
        gstRateBps: 1800,
        gstAmount: 360,
        invoiceRef: `INV-DEMO-${Date.now().toString().slice(-6)}`,
        totalAmount: 2000,
        paidAmount: 500,
        balanceAmount: 1500,
        paymentStatus: "PARTIAL",
        reservationUsers: {
          create: [{ name: "Customer Demo", userId: customer.id }],
        },
      },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
