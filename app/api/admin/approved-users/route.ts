import { NextResponse } from "next/server";
import { BenefitClass, Role } from "@prisma/client";

import { ApiAuthorizationError, requireApiUser } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit";
import { getDefaultAllocation, RATE_LIMITS } from "@/lib/config";
import { prisma } from "@/lib/db";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { approvedUserSchema } from "@/lib/validation/admin";

export async function POST(request: Request) {
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

    const formData = await request.formData();

    const parsed = approvedUserSchema.safeParse({
      email: formData.get("email"),
      fullName: formData.get("fullName"),
      role: formData.get("role"),
      benefitClass: formData.get("benefitClass"),
      annualAllocation: formData.get("annualAllocation") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.redirect(new URL(`/admin/users?error=${parsed.error.issues[0]?.message}`, request.url));
    }

    const benefitClass = parsed.data.benefitClass ?? BenefitClass.EMPLOYEE;
    const annualAllocation = parsed.data.annualAllocation ?? getDefaultAllocation(benefitClass);
    const normalizedEmail = parsed.data.email.toLowerCase();

    const approvedUser = await prisma.approvedUser.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        fullName: parsed.data.fullName || null,
        role: parsed.data.role ?? Role.EMPLOYEE,
        benefitClass,
        annualAllocation,
        isActive: true,
        createdByUserId: admin.id,
      },
      update: {
        fullName: parsed.data.fullName || null,
        role: parsed.data.role ?? Role.EMPLOYEE,
        benefitClass,
        annualAllocation,
        isActive: true,
      },
    });

    await logAuditEvent({
      entityType: "APPROVED_USER",
      entityId: approvedUser.id,
      action: "APPROVED_USER_UPSERTED",
      performedByUserId: admin.id,
      metadata: {
        email: approvedUser.email,
      },
    });

    return NextResponse.redirect(new URL("/admin/users?message=Approved user saved", request.url));
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.redirect(new URL("/admin/users?error=Unable to save approved user", request.url));
  }
}
