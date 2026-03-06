import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser, mockCreateClaimForUser, MockApiAuthorizationError } = vi.hoisted(() => {
  class HoistedApiAuthorizationError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }

  return {
    mockRequireApiUser: vi.fn(),
    mockCreateClaimForUser: vi.fn(),
    MockApiAuthorizationError: HoistedApiAuthorizationError,
  };
});

vi.mock("@/lib/auth/authorization", () => ({
  requireApiUser: mockRequireApiUser,
  ApiAuthorizationError: MockApiAuthorizationError,
}));

vi.mock("@/lib/claims", () => ({
  createClaimForUser: mockCreateClaimForUser,
}));

import { POST } from "@/app/api/claims/route";

describe("POST /api/claims", () => {
  beforeEach(() => {
    mockRequireApiUser.mockReset();
    mockCreateClaimForUser.mockReset();
    mockRequireApiUser.mockResolvedValue({ id: "user_1" });
  });

  it("rejects submissions with no documents", async () => {
    const form = new FormData();
    form.set("expenseDate", "2026-03-06");
    form.set("providerName", "Clinic A");
    form.set("category", "MEDICAL_SERVICES");
    form.set("description", "Consult");
    form.set("amount", "150");

    const response = await POST(new Request("http://localhost/api/claims", { method: "POST", body: form }));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/claims/new?error=At%20least%20one%20receipt%20is%20required.");
  });

  it("submits a valid claim and redirects to claim detail", async () => {
    const form = new FormData();
    form.set("expenseDate", "2026-03-06");
    form.set("providerName", "Clinic B");
    form.set("category", "DENTAL");
    form.set("description", "Dental cleaning");
    form.set("amount", "230.40");
    form.set("notes", "Please include this in annual dental tally");
    form.set("documents", new File(["receipt"], "receipt.pdf", { type: "application/pdf" }));

    mockCreateClaimForUser.mockResolvedValue({
      duplicate: false,
      claim: { id: "claim_123" },
    });

    const response = await POST(new Request("http://localhost/api/claims", { method: "POST", body: form }));

    expect(mockCreateClaimForUser).toHaveBeenCalledTimes(1);
    expect(mockCreateClaimForUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        notes: "Please include this in annual dental tally",
      }),
    );
    expect(response.headers.get("location")).toContain("/claims/claim_123");
  });

  it("returns JSON response for authorization errors", async () => {
    const form = new FormData();
    form.set("expenseDate", "2026-03-06");
    form.set("providerName", "Clinic C");
    form.set("category", "VISION");
    form.set("description", "Vision exam");
    form.set("amount", "80");
    form.set("documents", new File(["receipt"], "receipt.pdf", { type: "application/pdf" }));

    mockRequireApiUser.mockRejectedValue(new MockApiAuthorizationError(403, "Forbidden"));

    const response = await POST(new Request("http://localhost/api/claims", { method: "POST", body: form }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Forbidden" });
  });
});
