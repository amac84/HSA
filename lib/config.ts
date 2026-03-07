import { BenefitClass } from "@prisma/client";

export const APP_NAME = "End In Mind Capital HSA Portal";
export const EMPLOYEE_ALLOCATION = 3500;
export const EXECUTIVE_ALLOCATION = 15000;
export const MAX_CLAIM_DOCUMENTS = 5;
export const CLAIM_RETENTION_YEARS = Number(process.env.CLAIM_RETENTION_YEARS ?? 6);

export const PLAN_YEAR = Number(process.env.PLAN_YEAR ?? new Date().getFullYear());

const bootstrapAdminEmails = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const BOOTSTRAP_ADMIN_EMAILS = bootstrapAdminEmails;

export function getDefaultAllocation(benefitClass: BenefitClass) {
  return benefitClass === BenefitClass.EXECUTIVE ? EXECUTIVE_ALLOCATION : EMPLOYEE_ALLOCATION;
}
