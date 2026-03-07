import Link from "next/link";

import { requirePageUser } from "@/lib/auth/authorization";

export default async function PolicyPage() {
  await requirePageUser();

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Health Spending Account (HSA) Policy</h1>
        <p className="text-sm text-slate-600">End In Mind Capital Inc.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">1. Purpose</h2>
        <p className="mt-2 text-slate-700">
          The Health Spending Account (HSA) is a tax-efficient program designed to provide financial assistance to
          employees and executives for eligible healthcare-related expenses.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">2. Employee Classes and Annual Allocations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>
            <span className="font-medium">Class 1 (Executives):</span> $15,000 annually.
          </li>
          <li>
            <span className="font-medium">Class 2 (Employees):</span> $3,500 annually.
          </li>
          <li>Allocations are provided on a calendar-year basis.</li>
          <li>Allocations are prorated for employees joining mid-year.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">3. Eligible Expenses</h2>
        <p className="mt-2 text-slate-700">
          Eligible expenses must comply with CRA guidelines and include (but are not limited to):
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>Prescription medications</li>
          <li>Dental care</li>
          <li>Vision care (glasses, contact lenses, laser eye surgery)</li>
          <li>Paramedical services (physiotherapy, chiropractic care, etc.)</li>
          <li>Comprehensive healthcare memberships such as Harrison Healthcare</li>
        </ul>
        <p className="mt-3 text-slate-700">
          For a full list, refer to the CRA Medical Expenses guide.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">4. Claim Submission Process</h2>
        <div className="mt-3 space-y-4 text-slate-700">
          <div>
            <h3 className="font-semibold">4.1 How to Submit a Claim</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-6">
              <li>Complete the HSA Claim Form template.</li>
              <li>
                Attach supporting documents:
                <ul className="mt-1 list-disc pl-6">
                  <li>Original receipts</li>
                  <li>Proof of payment</li>
                  <li>Any additional CRA-compliance documentation</li>
                </ul>
              </li>
              <li>
                Submit claims via email to <span className="font-medium">HSA@EndInMind.com</span> or upload through
                this internal portal.
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold">4.2 Reimbursement Timeline</h3>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>Claims are reviewed within 10 business days of submission.</li>
              <li>Approved claims are reimbursed by direct deposit within 15 business days.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">4.3 Claim Deadlines</h3>
            <p className="mt-2">Claims for a given calendar year must be submitted by January 31 of the following year.</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">5. Administration and Tracking</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>Records of allocations and claims are maintained for at least six years.</li>
          <li>Quarterly HSA remaining-balance updates are provided to employees and executives.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">6. Carry-Forward Rules</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>Unused allocations cannot be carried forward to the next calendar year.</li>
          <li>Claims exceeding annual allocation limits are not reimbursed.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">7. Tax Implications</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
          <li>HSA reimbursements are non-taxable benefits for employees and executives.</li>
          <li>Contributions made by End In Mind Capital Inc. are tax-deductible business expenses.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">8. Policy Updates</h2>
        <p className="mt-2 text-slate-700">
          This policy is reviewed annually and may be updated at End In Mind Capital Inc.’s discretion. Employees will be
          informed of changes in writing.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">HSA Claim &amp; Reimbursement Process</h2>
        <div className="mt-3 space-y-4 text-slate-700">
          <div>
            <h3 className="font-semibold">Step 1: Employee Enrollment</h3>
            <ul className="mt-2 list-disc pl-6">
              <li>Employees and executives are automatically enrolled when employment begins.</li>
              <li>New mid-year employees receive prorated allocations.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Step 2: Claim Submission</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-6">
              <li>Download/request the claim form.</li>
              <li>Complete expense details.</li>
              <li>Attach receipts and proof of payment.</li>
              <li>Submit by email or through this portal.</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold">Step 3: Review and Approval</h3>
            <ul className="mt-2 list-disc pl-6">
              <li>HR/Finance reviews claims for CRA compliance.</li>
              <li>Approved claims are marked for reimbursement.</li>
              <li>Denied claims include a reason.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Step 4: Reimbursement</h3>
            <p className="mt-2">Approved claims are reimbursed by direct deposit within 15 business days of approval.</p>
          </div>
          <div>
            <h3 className="font-semibold">Step 5: Balance Updates</h3>
            <p className="mt-2">Quarterly remaining-balance updates are sent by email.</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">HSA Claim Form Template</h2>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Employee Information</h3>
            <ul className="mt-2 list-disc pl-6 text-slate-700">
              <li>Name</li>
              <li>Employee ID</li>
              <li>Class (Executive/Employee)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Expense Details</h3>
            <ul className="mt-2 list-disc pl-6 text-slate-700">
              <li>Description of expense</li>
              <li>Provider name</li>
              <li>Date of expense</li>
              <li>Amount</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Attachments</h3>
            <ul className="mt-2 list-disc pl-6 text-slate-700">
              <li>Receipt (Yes/No)</li>
              <li>Proof of payment (Yes/No)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Employee Declaration</h3>
            <p className="mt-2 text-slate-700">
              I certify that the expenses submitted are accurate and eligible under the HSA policy.
            </p>
            <p className="mt-3 text-slate-700">Signature:</p>
            <p className="text-slate-700">Date:</p>
          </div>
        </div>
      </section>

      <footer className="pb-6 text-sm text-slate-600">
        Need help? Contact <span className="font-medium">HSA@EndInMind.com</span> or review the{" "}
        <Link className="text-blue-700 hover:underline" href="/claims/new">
          claim submission form
        </Link>
        .
      </footer>
    </article>
  );
}
