import { NextResponse } from "next/server";

import { ApiAuthorizationError, canAccessClaim, requireApiUser } from "@/lib/auth/authorization";
import { S3_CONFIG } from "@/lib/config";
import { prisma } from "@/lib/db";
import { resolveClaimDocument } from "@/lib/documents";

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

    const resolved = await resolveClaimDocument(document, S3_CONFIG.signedUrlTtlSeconds);

    if (resolved.kind === "redirect") {
      return NextResponse.redirect(resolved.url);
    }

    return new NextResponse(new Uint8Array(resolved.buffer), {
      headers: {
        "Content-Type": document.fileType,
        "Content-Disposition": `inline; filename="${document.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Stored document missing." }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: "Unable to fetch document." }, { status: 500 });
  }
}
