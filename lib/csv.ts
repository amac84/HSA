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

export async function buildClaimsCsv(planYear = PLAN_YEAR) {
  const claims = await prisma.claim.findMany({
    where: { planYear },
    orderBy: { submittedAt: "desc" },
    include: { user: true },
  });

  const header = [
    "user_name",
    "email",
    "class",
    "claim_amount",
    "status",
    "expense_date",
    "submission_date",
    "approval_date",
  ];

  const rows = claims.map((claim) => {
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
  });

  return [header.join(","), ...rows].join("\n");
}
