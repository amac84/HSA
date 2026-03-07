import { describe, expect, it } from "vitest";

import { asMoneyNumber, getRemainingBalance } from "@/lib/balances";

describe("balance utilities", () => {
  it("converts numeric strings to number", () => {
    expect(asMoneyNumber("152.35")).toBe(152.35);
  });

  it("returns zero for nullish values", () => {
    expect(asMoneyNumber(null)).toBe(0);
    expect(asMoneyNumber(undefined)).toBe(0);
  });

  it("computes remaining balance from annual allocation and approved totals", () => {
    expect(getRemainingBalance(3500, 1250.5)).toBe(2249.5);
  });

  it("never returns negative remaining balance", () => {
    expect(getRemainingBalance(100, 300)).toBe(0);
  });
});
