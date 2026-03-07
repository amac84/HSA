import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { canAccessClaim, isAdmin } from "@/lib/auth/authorization";

describe("authorization helpers", () => {
  it("recognizes admin role", () => {
    expect(isAdmin({ role: Role.ADMIN })).toBe(true);
    expect(isAdmin({ role: Role.EMPLOYEE })).toBe(false);
  });

  it("allows admin claim access for any claimant", () => {
    expect(
      canAccessClaim(
        {
          id: "admin-id",
          role: Role.ADMIN,
        },
        "someone-else-id",
      ),
    ).toBe(true);
  });

  it("allows claimants to access their own claims only", () => {
    expect(
      canAccessClaim(
        {
          id: "claimant-id",
          role: Role.EMPLOYEE,
        },
        "claimant-id",
      ),
    ).toBe(true);
    expect(
      canAccessClaim(
        {
          id: "claimant-id",
          role: Role.EMPLOYEE,
        },
        "other-id",
      ),
    ).toBe(false);
  });
});
