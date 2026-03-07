import Link from "next/link";

import { requirePageUser } from "@/lib/auth/authorization";
import { CLAIM_RETENTION_YEARS, PLAN_YEAR } from "@/lib/config";
import { prisma } from "@/lib/db";

export default async function MyDataPage() {
  const user = await requirePageUser();

  const [claimCount, latestClaim] = await Promise.all([
    prisma.claim.count({ where: { userId: user.id } }),
    prisma.claim.findFirst({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
      select: { submittedAt: true },
    }),
  ]);

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">My data</h1>
        <p className="text-sm text-slate-600">View and access your HSA personal information.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Profile data we hold</h2>
        <dl className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-900">Name</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Role</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Benefit class</dt>
            <dd>{user.benefitClass}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Claims data summary</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>Total claims on file: {claimCount}</li>
          <li>Most recent submission: {latestClaim ? latestClaim.submittedAt.toLocaleDateString() : "No claims yet"}</li>
          <li>Retention: records are kept for at least {CLAIM_RETENTION_YEARS} years.</li>
        </ul>
        <a
          className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          href={`/api/me/export?planYear=${PLAN_YEAR}`}
        >
          Download my claims export (CSV)
        </a>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Privacy and correction</h2>
        <p className="mt-2 text-slate-700">
          Review how your information is handled in the{" "}
          <Link className="text-blue-700 hover:underline" href="/policy/privacy">
            Privacy notice
          </Link>
          . To request corrections, email{" "}
          <a className="text-blue-700 hover:underline" href="mailto:HSA@EndInMind.com">
            HSA@EndInMind.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
