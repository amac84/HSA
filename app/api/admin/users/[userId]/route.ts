import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiUser } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { updateUserSchema } from "@/lib/validation/admin";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ userId: string }>;
  },
) {
  try {
    const admin = await requireApiUser({ admin: true });
    const { userId } = await context.params;
    const formData = await request.formData();

    const parsed = updateUserSchema.safeParse({
      role: formData.get("role"),
      benefitClass: formData.get("benefitClass"),
      annualAllocation: formData.get("annualAllocation"),
      isActive: formData.get("isActive"),
    });

    if (!parsed.success) {
      return NextResponse.redirect(new URL(`/admin/users?error=${parsed.error.issues[0]?.message}`, request.url));
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: parsed.data.role,
        benefitClass: parsed.data.benefitClass,
        annualAllocation: parsed.data.annualAllocation,
        isActive: parsed.data.isActive,
      },
    });

    await prisma.approvedUser.updateMany({
      where: { email: user.email },
      data: {
        role: user.role,
        benefitClass: user.benefitClass,
        annualAllocation: user.annualAllocation,
        isActive: user.isActive,
      },
    });

    await logAuditEvent({
      entityType: "USER",
      entityId: user.id,
      action: "USER_UPDATED_BY_ADMIN",
      performedByUserId: admin.id,
      metadata: {
        role: user.role,
        benefitClass: user.benefitClass,
        annualAllocation: Number(user.annualAllocation),
        isActive: user.isActive,
      },
    });

    return NextResponse.redirect(new URL("/admin/users?message=User updated", request.url));
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.redirect(new URL("/admin/users?error=Unable to update user", request.url));
  }
}
