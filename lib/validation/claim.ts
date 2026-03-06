import { ExpenseCategory } from "@prisma/client";
import { z } from "zod";

export const claimFormSchema = z.object({
  expenseDate: z.string().min(1, "Expense date is required."),
  providerName: z.string().min(1, "Provider name is required.").max(200, "Provider name is too long."),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1, "Description is required.").max(500, "Description is too long."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  notes: z.string().max(1000, "Notes are too long.").optional().default(""),
});

export const claimDecisionSchema = z.object({
  action: z.enum(["approve", "deny"]),
  adminNotes: z.string().max(1000, "Notes are too long.").optional().default(""),
  denialReason: z.string().max(500, "Denial reason is too long.").optional().default(""),
});

export type ClaimFormInput = z.infer<typeof claimFormSchema>;
