import { BenefitClass, Role } from "@prisma/client";
import { z } from "zod";

export const approvedUserSchema = z.object({
  email: z.email("Enter a valid email address.").max(255),
  fullName: z.string().max(255).optional().default(""),
  role: z.nativeEnum(Role).optional(),
  benefitClass: z.nativeEnum(BenefitClass).optional(),
  annualAllocation: z.coerce.number().positive().optional(),
});

export const updateUserSchema = z.object({
  role: z.nativeEnum(Role),
  benefitClass: z.nativeEnum(BenefitClass),
  annualAllocation: z.coerce.number().positive("Allocation must be greater than zero."),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});
