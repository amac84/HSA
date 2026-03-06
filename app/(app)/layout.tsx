import { PortalShell } from "@/components/layout/portal-shell";
import { requirePageUser } from "@/lib/auth/authorization";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();

  return <PortalShell user={user}>{children}</PortalShell>;
}
