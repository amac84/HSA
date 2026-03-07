import Link from "next/link";
import { ClaimStatus } from "@prisma/client";

import { requirePageAdmin } from "@/lib/auth/authorization";
import { PLAN_YEAR } from "@/lib/config";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  await requirePageAdmin();

  const [pendingCount, approvedCount, deniedCount, usersCount] = await Promise.all([
    prisma.claim.count({ where: { status: ClaimStatus.PENDING, planYear: PLAN_YEAR } }),
    prisma.claim.count({ where: { status: ClaimStatus.APPROVED, planYear: PLAN_YEAR } }),
    prisma.claim.count({ where: { status: ClaimStatus.DENIED, planYear: PLAN_YEAR } }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending claims</p>
          <p className="mt-2 text-2xl font-semibold">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Approved claims</p>
          <p className="mt-2 text-2xl font-semibold">{approvedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Denied claims</p>
          <p className="mt-2 text-2xl font-semibold">{deniedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active users</p>
          <p className="mt-2 text-2xl font-semibold">{usersCount}</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Shortcuts</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100" href="/admin/claims">
            Review claim queue
          </Link>
          <Link className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100" href="/admin/users">
            Manage users
          </Link>
          <Link className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100" href="/admin/export">
            Export claims CSV
          </Link>
        </div>
      </section>
    </div>
  );
}
