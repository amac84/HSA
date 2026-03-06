import Link from "next/link";
import { ClaimStatus } from "@prisma/client";

import { StatusBadge } from "@/components/claims/status-badge";
import { requirePageAdmin } from "@/lib/auth/authorization";
import { PLAN_YEAR } from "@/lib/config";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function AdminClaimsQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageAdmin();
  const params = await searchParams;
  const statusParam = typeof params.status === "string" ? params.status : "";
  const userParam = typeof params.user === "string" ? params.user : "";
  const sortParam = typeof params.sort === "string" ? params.sort : "newest";
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : "";

  const where = {
    planYear: PLAN_YEAR,
    ...(statusParam && statusParam in ClaimStatus ? { status: statusParam as ClaimStatus } : {}),
    ...(userParam ? { userId: userParam } : {}),
    ...(dateFrom || dateTo
      ? {
          submittedAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const [claims, users] = await Promise.all([
    prisma.claim.findMany({
      where,
      include: { user: true },
      orderBy: { submittedAt: sortParam === "oldest" ? "asc" : "desc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Claims queue</h1>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
        <label className="space-y-1 text-sm">
          <span>Status</span>
          <select className="w-full rounded-md border border-slate-300 px-2 py-1.5" defaultValue={statusParam} name="status">
            <option value="">All</option>
            {Object.values(ClaimStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>User</span>
          <select className="w-full rounded-md border border-slate-300 px-2 py-1.5" defaultValue={userParam} name="user">
            <option value="">All</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>From</span>
          <input className="w-full rounded-md border border-slate-300 px-2 py-1.5" defaultValue={dateFrom} name="dateFrom" type="date" />
        </label>
        <label className="space-y-1 text-sm">
          <span>To</span>
          <input className="w-full rounded-md border border-slate-300 px-2 py-1.5" defaultValue={dateTo} name="dateTo" type="date" />
        </label>
        <label className="space-y-1 text-sm">
          <span>Sort</span>
          <select className="w-full rounded-md border border-slate-300 px-2 py-1.5" defaultValue={sortParam} name="sort">
            <option value="newest">
              Newest
            </option>
            <option value="oldest">
              Oldest
            </option>
          </select>
        </label>
        <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 md:col-span-5 md:justify-self-start" type="submit">
          Apply filters
        </button>
      </form>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Claimant</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  No claims match these filters.
                </td>
              </tr>
            )}
            {claims.map((claim) => (
              <tr key={claim.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/claims/${claim.id}`} className="text-blue-700 hover:underline">
                    {claim.submittedAt.toLocaleDateString()}
                  </Link>
                </td>
                <td className="px-4 py-3">{claim.user.fullName}</td>
                <td className="px-4 py-3">{claim.category}</td>
                <td className="px-4 py-3">{formatCurrency(Number(claim.amount))}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={claim.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
