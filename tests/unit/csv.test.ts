import { describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    claim: {
      findMany: mockFindMany,
    },
  },
}));

import { buildClaimsCsv } from "@/lib/csv";

describe("buildClaimsCsv", () => {
  it("maps claim records to required export fields", async () => {
    mockFindMany.mockResolvedValue([
      {
        user: { fullName: "Elliot Employee", email: "employee@endinmind.example", benefitClass: "EMPLOYEE" },
        amount: 125.5,
        status: "APPROVED",
        expenseDate: new Date("2026-02-10T00:00:00.000Z"),
        submittedAt: new Date("2026-02-11T00:00:00.000Z"),
        decidedAt: new Date("2026-02-13T00:00:00.000Z"),
      },
    ]);

    const csv = await buildClaimsCsv(2026);

    expect(csv).toContain("user_name,email,class,claim_amount,status,expense_date,submission_date,approval_date");
    expect(csv).toContain("\"Elliot Employee\",\"employee@endinmind.example\",\"EMPLOYEE\",\"125.5\",\"APPROVED\"");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { planYear: 2026 },
      }),
    );
  });
});
