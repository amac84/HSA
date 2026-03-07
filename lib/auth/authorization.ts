import { Role, type User } from "@prisma/client";
import { redirect } from "next/navigation";

import { provisionAuthenticatedUser } from "@/lib/auth/provisioning";

export class ApiAuthorizationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isAdmin(user: Pick<User, "role">) {
  return user.role === Role.ADMIN;
}

export function canAccessClaim(user: Pick<User, "id" | "role">, claimantUserId: string) {
  if (isAdmin(user)) {
    return true;
  }

  return user.id === claimantUserId;
}

export async function requirePageUser() {
  const result = await provisionAuthenticatedUser();

  switch (result.status) {
    case "unauthenticated":
      redirect("/sign-in");
    case "unauthorized":
    case "inactive":
      redirect("/unauthorized");
    case "ok":
      return result.user;
  }
}

export async function requirePageAdmin() {
  const user = await requirePageUser();

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireApiUser(options?: { admin?: boolean }) {
  const result = await provisionAuthenticatedUser();

  switch (result.status) {
    case "unauthenticated":
      throw new ApiAuthorizationError(401, "Authentication required.");
    case "unauthorized":
      throw new ApiAuthorizationError(403, "User is not on the approved access list.");
    case "inactive":
      throw new ApiAuthorizationError(403, "User account is inactive.");
    case "ok":
      if (options?.admin && !isAdmin(result.user)) {
        throw new ApiAuthorizationError(403, "Admin access required.");
      }
      return result.user;
  }
}
