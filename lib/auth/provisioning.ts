import { BenefitClass, Role, type User } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

import { BOOTSTRAP_ADMIN_EMAILS, getDefaultAllocation } from "@/lib/config";
import { prisma } from "@/lib/db";

export type ProvisionStatus = "ok" | "unauthenticated" | "unauthorized" | "inactive";

export type ProvisionResult =
  | { status: "ok"; user: User }
  | { status: "unauthenticated" | "unauthorized" | "inactive" };

function getClerkDisplayName(email: string, firstName?: string | null, lastName?: string | null) {
  const value = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return value || email.split("@")[0] || "Portal User";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toBenefitClass(role: Role, configuredClass?: BenefitClass | null) {
  if (configuredClass) {
    return configuredClass;
  }

  return role === Role.EXECUTIVE || role === Role.ADMIN ? BenefitClass.EXECUTIVE : BenefitClass.EMPLOYEE;
}

export async function provisionAuthenticatedUser(): Promise<ProvisionResult> {
  const { userId } = await auth();

  if (!userId) {
    return { status: "unauthenticated" };
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;

  if (!email) {
    return { status: "unauthorized" };
  }

  const normalizedEmail = normalizeEmail(email);
  const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.includes(normalizedEmail);
  const approvedUser = await prisma.approvedUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (!isBootstrapAdmin && (!approvedUser || !approvedUser.isActive)) {
    return { status: "unauthorized" };
  }

  const targetRole = isBootstrapAdmin ? Role.ADMIN : (approvedUser?.role ?? Role.EMPLOYEE);
  const targetBenefitClass = toBenefitClass(targetRole, approvedUser?.benefitClass);
  const targetAnnualAllocation =
    Number(approvedUser?.annualAllocation ?? 0) || getDefaultAllocation(targetBenefitClass);

  const fullName =
    clerkUser?.fullName ||
    approvedUser?.fullName ||
    getClerkDisplayName(normalizedEmail, clerkUser?.firstName, clerkUser?.lastName);

  const existingByClerkId = await prisma.user.findUnique({ where: { clerkUserId: userId } });

  const user = existingByClerkId
    ? await prisma.user.update({
        where: { id: existingByClerkId.id },
        data: {
          email: normalizedEmail,
          fullName,
          ...(isBootstrapAdmin ? { role: Role.ADMIN } : {}),
          ...(approvedUser
            ? {
                role: approvedUser.role ?? undefined,
                benefitClass: approvedUser.benefitClass ?? undefined,
                annualAllocation: approvedUser.annualAllocation ?? undefined,
              }
            : {}),
        },
      })
    : await prisma.user.upsert({
        where: { email: normalizedEmail },
        create: {
          clerkUserId: userId,
          email: normalizedEmail,
          fullName,
          role: targetRole,
          benefitClass: targetBenefitClass,
          annualAllocation: targetAnnualAllocation,
          isActive: true,
        },
        update: {
          clerkUserId: userId,
          fullName,
          ...(isBootstrapAdmin ? { role: Role.ADMIN } : {}),
          ...(approvedUser
            ? {
                role: approvedUser.role ?? undefined,
                benefitClass: approvedUser.benefitClass ?? undefined,
                annualAllocation: approvedUser.annualAllocation ?? undefined,
              }
            : {}),
        },
      });

  if (!user.isActive) {
    return { status: "inactive" };
  }

  return { status: "ok", user };
}
