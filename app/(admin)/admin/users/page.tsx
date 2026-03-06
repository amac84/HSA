import { BenefitClass, Role } from "@prisma/client";

import { requirePageAdmin } from "@/lib/auth/authorization";
import { PLAN_YEAR } from "@/lib/config";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageAdmin();
  const query = await searchParams;
  const message = typeof query.message === "string" ? query.message : "";
  const error = typeof query.error === "string" ? query.error : "";

  const [users, approvedUsers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { fullName: "asc" },
    }),
    prisma.approvedUser.findMany({
      orderBy: { email: "asc" },
    }),
  ]);

  const approvedTotalsByUser = await prisma.claim.groupBy({
    by: ["userId"],
    where: {
      status: "APPROVED",
      planYear: PLAN_YEAR,
    },
    _sum: {
      amount: true,
    },
  });

  const approvedMap = new Map(
    approvedTotalsByUser.map((item) => [item.userId, Number(item._sum.amount ?? 0)]),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">User management</h1>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Add approved user</h2>
        <p className="mt-1 text-sm text-slate-600">Users can only access the portal if they are on this allowlist.</p>
        <form action="/api/admin/approved-users" className="mt-4 grid gap-3 md:grid-cols-2" method="post">
          <label className="space-y-1">
            <span className="text-sm">Email</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="email" required type="email" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Full name (optional)</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="fullName" />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Role</span>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2" defaultValue={Role.EMPLOYEE} name="role">
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm">Benefit class</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={BenefitClass.EMPLOYEE}
              name="benefitClass"
            >
              {Object.values(BenefitClass).map((benefitClass) => (
                <option key={benefitClass} value={benefitClass}>
                  {benefitClass}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm">Annual allocation (CAD)</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" min="1" name="annualAllocation" step="0.01" type="number" />
          </label>
          <button className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600 md:col-span-2 md:justify-self-start" type="submit">
            Add approved user
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Approved user allowlist</h2>
        <ul className="mt-4 space-y-3">
          {approvedUsers.length === 0 && <li className="text-sm text-slate-500">No approved users configured.</li>}
          {approvedUsers.map((approvedUser) => (
            <li className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3" key={approvedUser.id}>
              <div className="text-sm">
                <p className="font-medium">{approvedUser.email}</p>
                <p className="text-slate-600">
                  {approvedUser.role ?? Role.EMPLOYEE} • {approvedUser.benefitClass ?? BenefitClass.EMPLOYEE} •{" "}
                  {approvedUser.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <form action={`/api/admin/approved-users/${approvedUser.id}/revoke`} method="post">
                <button className="rounded-md border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50" type="submit">
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Allocation</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Approved total ({PLAN_YEAR})</th>
              <th className="px-4 py-3">Remaining ({PLAN_YEAR})</th>
              <th className="px-4 py-3">Update</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const approvedTotal = approvedMap.get(user.id) ?? 0;
              const remaining = Math.max(0, Number(user.annualAllocation) - approvedTotal);

              return (
                <tr className="border-t border-slate-100" key={user.id}>
                  <td className="px-4 py-3">{user.fullName}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.benefitClass}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(user.annualAllocation))}</td>
                  <td className="px-4 py-3">{user.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">{formatCurrency(approvedTotal)}</td>
                  <td className="px-4 py-3">{formatCurrency(remaining)}</td>
                  <td className="px-4 py-3">
                    <form action={`/api/admin/users/${user.id}`} className="grid gap-2 md:grid-cols-5" method="post">
                      <select className="rounded-md border border-slate-300 px-2 py-1.5" defaultValue={user.role} name="role">
                        {Object.values(Role).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <select className="rounded-md border border-slate-300 px-2 py-1.5" defaultValue={user.benefitClass} name="benefitClass">
                        {Object.values(BenefitClass).map((benefitClass) => (
                          <option key={benefitClass} value={benefitClass}>
                            {benefitClass}
                          </option>
                        ))}
                      </select>
                      <input
                        className="rounded-md border border-slate-300 px-2 py-1.5"
                        defaultValue={Number(user.annualAllocation)}
                        min="1"
                        name="annualAllocation"
                        step="0.01"
                        type="number"
                      />
                      <select className="rounded-md border border-slate-300 px-2 py-1.5" defaultValue={String(user.isActive)} name="isActive">
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      <button className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100" type="submit">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
