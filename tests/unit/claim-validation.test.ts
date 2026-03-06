import { ExpenseCategory } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { claimFormSchema } from "@/lib/validation/claim";

describe("claim form validation", () => {
  it("accepts a valid claim payload", () => {
    const parsed = claimFormSchema.safeParse({
      expenseDate: "2026-03-05",
      providerName: "Harrison Healthcare",
      category: ExpenseCategory.MEMBERSHIP,
      description: "Annual membership fee",
      amount: "325",
      notes: "Covered by policy",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid amounts", () => {
    const parsed = claimFormSchema.safeParse({
      expenseDate: "2026-03-05",
      providerName: "Harrison Healthcare",
      category: ExpenseCategory.MEMBERSHIP,
      description: "Annual membership fee",
      amount: "0",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });
});
