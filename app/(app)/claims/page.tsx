import Link from "next/link";

import { StatusBadge } from "@/components/claims/status-badge";
import { requirePageUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function ClaimsHistoryPage() {
  const user = await requirePageUser();
  const claims = await prisma.claim.findMany({
    where: { userId: user.id },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Claim history</h1>
        <Link href="/claims/new" className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600">
          Submit new claim
        </Link>
      </div>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Submission date</th>
              <th className="px-4 py-3">Expense date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Decision date</th>
              <th className="px-4 py-3">Denial reason</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={7}>
                  No claims yet.
                </td>
              </tr>
            )}
            {claims.map((claim) => (
              <tr key={claim.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link href={`/claims/${claim.id}`} className="text-blue-700 hover:underline">
                    {claim.submittedAt.toLocaleDateString()}
                  </Link>
                </td>
                <td className="px-4 py-3">{claim.expenseDate.toLocaleDateString()}</td>
                <td className="px-4 py-3">{formatCurrency(Number(claim.amount))}</td>
                <td className="px-4 py-3">{claim.category}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={claim.status} />
                </td>
                <td className="px-4 py-3">{claim.decidedAt?.toLocaleDateString() ?? "—"}</td>
                <td className="px-4 py-3">{claim.denialReason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
