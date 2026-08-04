import { ExpenseCategory } from "@prisma/client";

import { MAX_CLAIM_DOCUMENTS } from "@/lib/config";
import { requirePageUser } from "@/lib/auth/authorization";

const categories = Object.values(ExpenseCategory);

export default async function NewClaimPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Submit a new claim</h1>
      <p className="text-sm text-slate-600">
        Upload at least one receipt. You can add up to {MAX_CLAIM_DOCUMENTS} files total. Supported types:
        PDF/JPG/PNG/HEIC (max 10MB each).
      </p>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <form
        action="/api/claims"
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
        encType="multipart/form-data"
        method="post"
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium">Expense date</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="expenseDate" required type="date" />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Provider name</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="providerName" required />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Expense category</span>
          <select className="w-full rounded-md border border-slate-300 px-3 py-2" name="category" required>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Description</span>
          <textarea className="w-full rounded-md border border-slate-300 px-3 py-2" name="description" required rows={3} />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Amount (CAD)</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            min="0.01"
            name="amount"
            required
            step="0.01"
            type="number"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Optional notes</span>
          <textarea className="w-full rounded-md border border-slate-300 px-3 py-2" name="notes" rows={3} />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Receipts and supporting documents</span>
          <input
            accept=".pdf,.jpg,.jpeg,.png,.heic"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            multiple
            name="documents"
            required
            type="file"
          />
        </label>

        <button className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600" type="submit">
          Submit claim
        </button>
      </form>
    </div>
  );
}
