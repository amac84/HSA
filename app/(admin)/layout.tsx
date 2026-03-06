import { PortalShell } from "@/components/layout/portal-shell";
import { requirePageAdmin } from "@/lib/auth/authorization";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageAdmin();

  return <PortalShell user={user}>{children}</PortalShell>;
}
