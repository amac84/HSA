import { format } from "date-fns";

import { PLAN_YEAR } from "@/lib/config";
import { prisma } from "@/lib/db";

function escapeCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = String(value);
  const escaped = raw.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

function claimsCsvHeader() {
  return [
    "user_name",
    "email",
    "class",
    "claim_amount",
    "status",
    "expense_date",
    "submission_date",
    "approval_date",
  ];
}

function toClaimCsvRow(claim: {
  user: { fullName: string; email: string; benefitClass: string };
  amount: number | string;
  status: string;
  expenseDate: Date;
  submittedAt: Date;
  decidedAt: Date | null;
}) {
  const approvalDate = claim.decidedAt ? format(claim.decidedAt, "yyyy-MM-dd") : "";
  return [
    escapeCsv(claim.user.fullName),
    escapeCsv(claim.user.email),
    escapeCsv(claim.user.benefitClass),
    escapeCsv(Number(claim.amount)),
    escapeCsv(claim.status),
    escapeCsv(format(claim.expenseDate, "yyyy-MM-dd")),
    escapeCsv(format(claim.submittedAt, "yyyy-MM-dd")),
    escapeCsv(approvalDate),
  ].join(",");
}

export async function buildClaimsCsv(planYear = PLAN_YEAR) {
  const claims = await prisma.claim.findMany({
    where: { planYear },
    orderBy: { submittedAt: "desc" },
    include: { user: true },
  });

  const header = claimsCsvHeader();
  const rows = claims.map(toClaimCsvRow);

  return [header.join(","), ...rows].join("\n");
}

export async function buildUserClaimsCsv(userId: string, planYear = PLAN_YEAR) {
  const claims = await prisma.claim.findMany({
    where: {
      userId,
      planYear,
    },
    orderBy: { submittedAt: "desc" },
    include: { user: true },
  });
  const header = claimsCsvHeader();
  const rows = claims.map(toClaimCsvRow);

  return [header.join(","), ...rows].join("\n");
}
