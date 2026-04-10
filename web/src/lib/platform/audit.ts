import { prisma } from "@/lib/platform/prisma";

export async function logAudit(input: {
  storeId?: string | null;
  reservationId?: string | null;
  actorType: "ADMIN" | "CUSTOMER" | "SYSTEM";
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  note?: string;
}) {
  await prisma.auditLog.create({
    data: {
      storeId: input.storeId ?? null,
      reservationId: input.reservationId ?? null,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      beforeJson: input.before === undefined ? null : JSON.stringify(input.before),
      afterJson: input.after === undefined ? null : JSON.stringify(input.after),
      note: input.note ?? null,
      createdBy: input.actorId ?? null,
    },
  });
}
