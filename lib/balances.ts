import { ClaimStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export function asMoneyNumber(value: number | string | bigint | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export function getRemainingBalance(annualAllocation: number, approvedTotal: number) {
  return Math.max(0, Number((annualAllocation - approvedTotal).toFixed(2)));
}

export async function getUserBalanceSummary(userId: string, planYear: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      annualAllocation: true,
      benefitClass: true,
      role: true,
      fullName: true,
      email: true,
    },
  });

  if (!user) {
    return null;
  }

  const approvedAggregate = await prisma.claim.aggregate({
    where: {
      userId,
      planYear,
      status: ClaimStatus.APPROVED,
    },
    _sum: {
      amount: true,
    },
  });

  const approvedTotal = asMoneyNumber(approvedAggregate._sum.amount?.toString());
  const annualAllocation = asMoneyNumber(user.annualAllocation.toString());
  const remainingBalance = getRemainingBalance(annualAllocation, approvedTotal);

  return {
    ...user,
    annualAllocation,
    approvedTotal,
    remainingBalance,
  };
}
