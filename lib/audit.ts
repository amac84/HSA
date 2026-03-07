import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type AuditInput = {
  entityType: string;
  entityId: string;
  action: string;
  performedByUserId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function logAuditEvent(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      performedByUserId: input.performedByUserId ?? null,
      metadata: input.metadata,
    },
  });
}
