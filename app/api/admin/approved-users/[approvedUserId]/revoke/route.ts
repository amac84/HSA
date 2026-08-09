import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiUser } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit";
import { RATE_LIMITS } from "@/lib/config";
import { prisma } from "@/lib/db";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ approvedUserId: string }>;
  },
) {
  try {
    const admin = await requireApiUser({ admin: true });

    const rateLimit = await enforceRateLimit({
      key: `admin:${admin.id}`,
      limit: RATE_LIMITS.admin.max,
      windowMs: RATE_LIMITS.admin.windowMs,
    });
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit);
    }

    const { approvedUserId } = await context.params;

    const approvedUser = await prisma.approvedUser.update({
      where: { id: approvedUserId },
      data: { isActive: false },
    });

    await logAuditEvent({
      entityType: "APPROVED_USER",
      entityId: approvedUser.id,
      action: "APPROVED_USER_REVOKED",
      performedByUserId: admin.id,
      metadata: { email: approvedUser.email },
    });

    return NextResponse.redirect(new URL("/admin/users?message=Approved user revoked", request.url));
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.redirect(new URL("/admin/users?error=Unable to revoke approved user", request.url));
  }
}
