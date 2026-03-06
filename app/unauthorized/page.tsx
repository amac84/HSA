import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Access restricted</h1>
      <p className="text-slate-600">
        You signed in successfully, but your account is not on the approved user list or is inactive.
      </p>
      <p className="text-slate-600">
        Contact an HSA administrator to request access.
      </p>
      <Link href="/sign-in" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100">
        Return to sign-in
      </Link>
    </div>
  );
}
