import { ClaimDocumentType, ClaimStatus, type ExpenseCategory, type User } from "@prisma/client";

import { PLAN_YEAR } from "@/lib/config";
import { prisma } from "@/lib/db";
import { saveClaimDocument } from "@/lib/documents";
import { logAuditEvent } from "@/lib/audit";
import { canAccessClaim } from "@/lib/auth/authorization";

type NewClaimInput = {
  expenseDate: Date;
  providerName: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes?: string;
  files: File[];
};

export async function createClaimForUser(user: User, input: NewClaimInput) {
  const recentDuplicate = await prisma.claim.findFirst({
    where: {
      userId: user.id,
      providerName: input.providerName,
      amount: input.amount,
      expenseDate: input.expenseDate,
      createdAt: {
        gte: new Date(Date.now() - 2 * 60 * 1000),
      },
    },
  });

  if (recentDuplicate) {
    return { claim: recentDuplicate, duplicate: true as const };
  }

  const claim = await prisma.claim.create({
    data: {
      userId: user.id,
      expenseDate: input.expenseDate,
      providerName: input.providerName,
      category: input.category,
      description: input.description,
      userNotes: input.notes || null,
      amount: input.amount,
      status: ClaimStatus.PENDING,
      planYear: PLAN_YEAR,
    },
  });

  const documents = [];
  for (const [index, file] of input.files.entries()) {
    const stored = await saveClaimDocument(claim.id, file);
    documents.push({
      claimId: claim.id,
      fileName: stored.fileName,
      storageProvider: stored.storageProvider,
      storageKey: stored.storageKey,
      fileType: stored.fileType,
      documentType: index === 0 ? ClaimDocumentType.RECEIPT : ClaimDocumentType.SUPPORTING_DOCUMENT,
    });
  }

  if (documents.length > 0) {
    await prisma.claimDocument.createMany({
      data: documents,
    });
  }

  await logAuditEvent({
    entityType: "CLAIM",
    entityId: claim.id,
    action: "CLAIM_CREATED",
    performedByUserId: user.id,
    metadata: {
      amount: input.amount,
      category: input.category,
      planYear: PLAN_YEAR,
      documentCount: documents.length,
    },
  });

  return { claim, duplicate: false as const };
}

export async function getClaimForViewer(claimId: string, viewer: Pick<User, "id" | "role">) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      user: true,
      documents: true,
      decidedByUser: true,
    },
  });

  if (!claim) {
    return null;
  }

  if (!canAccessClaim(viewer, claim.userId)) {
    return null;
  }

  return claim;
}

export async function reviewClaim(
  claimId: string,
  adminUser: Pick<User, "id">,
  decision: {
    action: "approve" | "deny";
    denialReason?: string;
    adminNotes?: string;
  },
) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
  });

  if (!claim) {
    return { status: "not_found" as const };
  }

  if (claim.status !== ClaimStatus.PENDING) {
    return { status: "already_decided" as const, claim };
  }

  if (decision.action === "deny" && !decision.denialReason?.trim()) {
    return { status: "missing_denial_reason" as const };
  }

  const updated = await prisma.claim.update({
    where: { id: claim.id },
    data: {
      status: decision.action === "approve" ? ClaimStatus.APPROVED : ClaimStatus.DENIED,
      decidedAt: new Date(),
      decidedByUserId: adminUser.id,
      denialReason: decision.action === "deny" ? decision.denialReason?.trim() : null,
      adminNotes: decision.adminNotes?.trim() || null,
    },
  });

  await logAuditEvent({
    entityType: "CLAIM",
    entityId: claim.id,
    action: decision.action === "approve" ? "CLAIM_APPROVED" : "CLAIM_DENIED",
    performedByUserId: adminUser.id,
    metadata: {
      denialReason: decision.denialReason?.trim() ?? null,
    },
  });

  return { status: "ok" as const, claim: updated };
}
