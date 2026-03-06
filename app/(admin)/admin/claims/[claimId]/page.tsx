import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/claims/status-badge";
import { requirePageAdmin } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function AdminClaimReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ claimId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageAdmin();
  const { claimId } = await params;
  const query = await searchParams;
  const message = typeof query.message === "string" ? query.message : "";
  const error = typeof query.error === "string" ? query.error : "";

  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      user: true,
      documents: true,
      decidedByUser: true,
    },
  });

  if (!claim) {
    notFound();
  }

  const approvedAggregate = await prisma.claim.aggregate({
    where: {
      userId: claim.userId,
      status: "APPROVED",
      planYear: claim.planYear,
    },
    _sum: {
      amount: true,
    },
  });

  const approvedTotal = Number(approvedAggregate._sum.amount ?? 0);
  const remainingBalance = Math.max(0, Number(claim.user.annualAllocation) - approvedTotal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Claim review</h1>
        <Link href="/admin/claims" className="text-sm text-blue-700 hover:underline">
          Back to queue
        </Link>
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Claimant</p>
            <p>{claim.user.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Class</p>
            <p>{claim.user.benefitClass}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Annual allocation</p>
            <p>{formatCurrency(Number(claim.user.annualAllocation))}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Approved total to date</p>
            <p>{formatCurrency(approvedTotal)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Remaining balance</p>
            <p>{formatCurrency(remainingBalance)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <StatusBadge status={claim.status} />
          </div>
        </div>

        <hr className="my-6 border-slate-200" />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Provider</p>
            <p>{claim.providerName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Expense date</p>
            <p>{claim.expenseDate.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Submitted amount</p>
            <p>{formatCurrency(Number(claim.amount))}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Category</p>
            <p>{claim.category}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-500">Description</p>
          <p>{claim.description}</p>
        </div>

        {claim.userNotes && (
          <div className="mt-4">
            <p className="text-sm text-slate-500">Claimant notes</p>
            <p>{claim.userNotes}</p>
          </div>
        )}

        {claim.adminNotes && (
          <div className="mt-4">
            <p className="text-sm text-slate-500">Internal notes</p>
            <p>{claim.adminNotes}</p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Documents</h2>
        <ul className="mt-2 space-y-1">
          {claim.documents.length === 0 && <li className="text-sm text-slate-500">No documents uploaded.</li>}
          {claim.documents.map((document) => (
            <li key={document.id}>
              <a
                className="text-blue-700 hover:underline"
                href={`/api/documents/${document.id}`}
                rel="noreferrer"
                target="_blank"
              >
                {document.fileName}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Decision</h2>
        {claim.status !== "PENDING" ? (
          <p className="mt-2 text-sm text-slate-600">
            This claim was already decided on {claim.decidedAt?.toLocaleString() ?? "—"} by{" "}
            {claim.decidedByUser?.fullName ?? "Unknown"}.
          </p>
        ) : (
          <form action={`/api/admin/claims/${claim.id}/decision`} className="mt-4 space-y-4" method="post">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Internal notes</span>
              <textarea className="w-full rounded-md border border-slate-300 px-3 py-2" name="adminNotes" rows={3} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Denial reason (required if denying)</span>
              <textarea className="w-full rounded-md border border-slate-300 px-3 py-2" name="denialReason" rows={3} />
            </label>
            <div className="flex gap-3">
              <button
                className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-600"
                name="action"
                type="submit"
                value="approve"
              >
                Approve claim
              </button>
              <button
                className="rounded-md bg-rose-700 px-4 py-2 font-medium text-white hover:bg-rose-600"
                name="action"
                type="submit"
                value="deny"
              >
                Deny claim
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
