import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser, mockReviewClaim, MockApiAuthorizationError } = vi.hoisted(() => {
  class HoistedApiAuthorizationError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }

  return {
    mockRequireApiUser: vi.fn(),
    mockReviewClaim: vi.fn(),
    MockApiAuthorizationError: HoistedApiAuthorizationError,
  };
});

vi.mock("@/lib/auth/authorization", () => ({
  requireApiUser: mockRequireApiUser,
  ApiAuthorizationError: MockApiAuthorizationError,
}));

vi.mock("@/lib/claims", () => ({
  reviewClaim: mockReviewClaim,
}));

import { POST } from "@/app/api/admin/claims/[claimId]/decision/route";

describe("POST /api/admin/claims/[claimId]/decision", () => {
  beforeEach(() => {
    mockRequireApiUser.mockReset();
    mockReviewClaim.mockReset();
    mockRequireApiUser.mockResolvedValue({ id: "admin_1", role: "ADMIN" });
  });

  it("rejects deny decisions without reason", async () => {
    const form = new FormData();
    form.set("action", "deny");
    form.set("denialReason", "");
    form.set("adminNotes", "Need additional receipt detail");

    mockReviewClaim.mockResolvedValue({ status: "missing_denial_reason" });

    const response = await POST(new Request("http://localhost/api/admin/claims/claim_a/decision", { method: "POST", body: form }), {
      params: Promise.resolve({ claimId: "claim_a" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/claims/claim_a?error=Denial%20reason%20is%20required.");
  });

  it("redirects with success message when claim is updated", async () => {
    const form = new FormData();
    form.set("action", "approve");
    form.set("denialReason", "");
    form.set("adminNotes", "Approved");

    mockReviewClaim.mockResolvedValue({ status: "ok", claim: { id: "claim_a" } });

    const response = await POST(new Request("http://localhost/api/admin/claims/claim_a/decision", { method: "POST", body: form }), {
      params: Promise.resolve({ claimId: "claim_a" }),
    });

    expect(mockReviewClaim).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toContain("/admin/claims/claim_a?message=Claim%20updated");
  });

  it("returns JSON for authorization errors", async () => {
    const form = new FormData();
    form.set("action", "approve");
    form.set("adminNotes", "Approved");
    form.set("denialReason", "");

    mockRequireApiUser.mockRejectedValue(new MockApiAuthorizationError(403, "Admin only"));

    const response = await POST(new Request("http://localhost/api/admin/claims/claim_a/decision", { method: "POST", body: form }), {
      params: Promise.resolve({ claimId: "claim_a" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Admin only" });
  });
});
