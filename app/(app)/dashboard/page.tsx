import Link from "next/link";

import { StatusBadge } from "@/components/claims/status-badge";
import { requirePageUser } from "@/lib/auth/authorization";
import { getUserBalanceSummary } from "@/lib/balances";
import { PLAN_YEAR } from "@/lib/config";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requirePageUser();
  const balance = await getUserBalanceSummary(user.id, PLAN_YEAR);

  const recentClaims = await prisma.claim.findMany({
    where: { userId: user.id },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  if (!balance) {
    return <p>Unable to load account summary.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {balance.fullName}</h1>
          <p className="text-sm text-slate-600">Plan year {PLAN_YEAR} • {balance.benefitClass}</p>
        </div>
        <Link href="/claims/new" className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600">
          Submit claim
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Annual allocation</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(balance.annualAllocation)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Approved claims total</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(balance.approvedTotal)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Remaining balance</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(balance.remainingBalance)}</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Recent claims</h2>
          <Link href="/claims" className="text-sm text-blue-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    No claims yet.
                  </td>
                </tr>
              )}
              {recentClaims.map((claim) => (
                <tr className="border-t border-slate-100" key={claim.id}>
                  <td className="px-4 py-3">
                    <Link href={`/claims/${claim.id}`} className="text-blue-700 hover:underline">
                      {claim.submittedAt.toLocaleDateString()}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{claim.category}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(claim.amount))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={claim.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Need policy details?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review eligible expenses, deadlines, reimbursement timelines, and claim template requirements.
        </p>
        <Link className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline" href="/policy">
          View HSA policy
        </Link>
      </section>
    </div>
  );
}
