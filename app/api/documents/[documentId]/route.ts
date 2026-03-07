import { NextResponse } from "next/server";

import { ApiAuthorizationError, canAccessClaim, requireApiUser } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { readStoredDocument } from "@/lib/documents";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ documentId: string }>;
  },
) {
  try {
    const user = await requireApiUser();
    const { documentId } = await context.params;
    const document = await prisma.claimDocument.findUnique({
      where: { id: documentId },
      include: { claim: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (!canAccessClaim(user, document.claim.userId)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await logAuditEvent({
      entityType: "CLAIM_DOCUMENT",
      entityId: document.id,
      action: "DOCUMENT_DOWNLOAD",
      performedByUserId: user.id,
      metadata: {
        claimId: document.claimId,
      },
    });

    const { buffer } = await readStoredDocument(document.filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": document.fileType,
        "Content-Disposition": `inline; filename="${document.fileName.replace(/"/g, "")}"`,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
