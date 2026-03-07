import { CLAIM_RETENTION_YEARS } from "@/lib/config";
import { requirePageUser } from "@/lib/auth/authorization";

export default async function PrivacyPolicyPage() {
  await requirePageUser();

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Privacy Notice</h1>
        <p className="text-sm text-slate-600">End In Mind Capital Inc. HSA Portal</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">1. Accountability</h2>
        <p className="mt-2 text-slate-700">
          End In Mind Capital Inc. is responsible for personal information processed in this portal for HSA administration.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">2. What we collect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>Identity and account information (name, work email, role, benefit class, account status).</li>
          <li>Benefits data (annual allocation, claim amounts, claim status, decision timestamps).</li>
          <li>Claim details (expense date, category, provider name, description, notes, uploaded documents).</li>
          <li>Governance and security records (audit events for key actions and access to sensitive exports).</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">3. Why we collect and use information</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>Verify access to the internal portal.</li>
          <li>Review and reimburse eligible HSA claims.</li>
          <li>Maintain audit and governance records.</li>
          <li>Meet tax, accounting, and legal recordkeeping obligations.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">4. Who can access your information</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>Employees can view their own claim and document records.</li>
          <li>Authorized HSA admins can review claims and supporting documents to administer the plan.</li>
          <li>Finance/governance users may access approved exports for reporting and recordkeeping.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">5. Retention and disposal</h2>
        <p className="mt-2 text-slate-700">
          HSA records are retained for at least {CLAIM_RETENTION_YEARS} years to support tax and audit obligations,
          then securely deleted or anonymized according to internal procedures.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">6. Third-party processing</h2>
        <p className="mt-2 text-slate-700">
          This portal uses third-party service providers for authentication, hosting, and database operations. Where
          providers process data outside British Columbia, End In Mind Capital Inc. applies contractual and security safeguards
          appropriate to the sensitivity of the information.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">7. Access and correction requests</h2>
        <p className="mt-2 text-slate-700">
          You can review your records in-app and download your claim export from the <span className="font-medium">My data</span>{" "}
          page. To request correction or additional access details, contact{" "}
          <a className="text-blue-700 hover:underline" href="mailto:HSA@EndInMind.com">
            HSA@EndInMind.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
