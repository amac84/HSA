import { PLAN_YEAR } from "@/lib/config";
import { requirePageAdmin } from "@/lib/auth/authorization";

export default async function AdminExportPage() {
  await requirePageAdmin();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Export claims</h1>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          Export claim data for finance, governance, and tax recordkeeping. The export intentionally excludes
          sensitive free-text claim notes and medical details.
        </p>
        <a
          className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-600"
          href={`/api/admin/export/claims?planYear=${PLAN_YEAR}`}
        >
          Download CSV for {PLAN_YEAR}
        </a>
      </section>
    </div>
  );
}
