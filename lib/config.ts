import { BenefitClass } from "@prisma/client";

export const APP_NAME = "End in Mind HSA Portal";
export const EMPLOYEE_ALLOCATION = 3500;
export const EXECUTIVE_ALLOCATION = 15000;
export const MAX_CLAIM_DOCUMENTS = 5;
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]);
export const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
]);

export const PLAN_YEAR = Number(process.env.PLAN_YEAR ?? new Date().getFullYear());

const bootstrapAdminEmails = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const BOOTSTRAP_ADMIN_EMAILS = bootstrapAdminEmails;

export function getDefaultAllocation(benefitClass: BenefitClass) {
  return benefitClass === BenefitClass.EXECUTIVE ? EXECUTIVE_ALLOCATION : EMPLOYEE_ALLOCATION;
}
