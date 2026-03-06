import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/claims/status-badge";
import { requirePageUser } from "@/lib/auth/authorization";
import { getClaimForViewer } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";

export default async function ClaimDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ claimId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser();
  const { claimId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";
  const claim = await getClaimForViewer(claimId, user);

  if (!claim) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Claim details</h1>
        <Link href="/claims" className="text-sm text-blue-700 hover:underline">
          Back to history
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Provider</dt>
            <dd>{claim.providerName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Status</dt>
            <dd>
              <StatusBadge status={claim.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Expense date</dt>
            <dd>{claim.expenseDate.toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Amount</dt>
            <dd>{formatCurrency(Number(claim.amount))}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Category</dt>
            <dd>{claim.category}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Submitted</dt>
            <dd>{claim.submittedAt.toLocaleString()}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <h2 className="text-sm text-slate-500">Description</h2>
          <p>{claim.description}</p>
        </div>

        {claim.userNotes && (
          <div className="mt-4">
            <h2 className="text-sm text-slate-500">Your notes</h2>
            <p>{claim.userNotes}</p>
          </div>
        )}

        {claim.status === "DENIED" && claim.denialReason && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
            <p className="font-semibold">Denial reason</p>
            <p>{claim.denialReason}</p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Documents</h2>
        <ul className="mt-3 space-y-2">
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
    </div>
  );
}
