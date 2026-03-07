import Link from "next/link";
import { Role, type User } from "@prisma/client";
import { SignOutButton } from "@clerk/nextjs";

import { APP_NAME } from "@/lib/config";

type PortalShellProps = {
  user: Pick<User, "fullName" | "role">;
  children: React.ReactNode;
};

export function PortalShell({ user, children }: PortalShellProps) {
  const adminNav = user.role === Role.ADMIN;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              {APP_NAME}
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="hover:text-blue-700">
                Dashboard
              </Link>
              <Link href="/claims" className="hover:text-blue-700">
                Claims
              </Link>
              <Link href="/claims/new" className="hover:text-blue-700">
                Submit claim
              </Link>
              <Link href="/policy" className="hover:text-blue-700">
                Policy
              </Link>
              <Link href="/policy/privacy" className="hover:text-blue-700">
                Privacy
              </Link>
              <Link href="/my-data" className="hover:text-blue-700">
                My data
              </Link>
              {adminNav && (
                <>
                  <Link href="/admin" className="hover:text-blue-700">
                    Admin
                  </Link>
                  <Link href="/admin/users" className="hover:text-blue-700">
                    Users
                  </Link>
                  <Link href="/admin/claims" className="hover:text-blue-700">
                    Queue
                  </Link>
                  <Link href="/admin/export" className="hover:text-blue-700">
                    Export
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>{user.fullName}</span>
            <SignOutButton>
              <button
                className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100"
                type="button"
              >
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
