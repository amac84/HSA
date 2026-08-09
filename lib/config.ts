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

export type StorageProviderName = "local" | "s3";

export const STORAGE_PROVIDER: StorageProviderName =
  process.env.STORAGE_PROVIDER?.toLowerCase() === "s3" ? "s3" : "local";

export const S3_CONFIG = {
  bucket: process.env.S3_BUCKET ?? "",
  region: process.env.S3_REGION ?? "us-east-1",
  accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  endpoint: process.env.S3_ENDPOINT || undefined,
  signedUrlTtlSeconds: Number(process.env.S3_SIGNED_URL_TTL_SECONDS ?? 300),
};

const bootstrapAdminEmails = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const BOOTSTRAP_ADMIN_EMAILS = bootstrapAdminEmails;

export function getDefaultAllocation(benefitClass: BenefitClass) {
  return benefitClass === BenefitClass.EXECUTIVE ? EXECUTIVE_ALLOCATION : EMPLOYEE_ALLOCATION;
}

export const RATE_LIMIT_ENABLED = (process.env.RATE_LIMIT_ENABLED ?? "true").toLowerCase() !== "false";

export const RATE_LIMIT_REDIS_URL = process.env.RATE_LIMIT_REDIS_URL || undefined;
export const RATE_LIMIT_REDIS_TOKEN = process.env.RATE_LIMIT_REDIS_TOKEN || undefined;

function positiveIntEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const RATE_LIMITS = {
  claims: {
    max: positiveIntEnv(process.env.RATE_LIMIT_CLAIMS_MAX, 10),
    windowMs: positiveIntEnv(process.env.RATE_LIMIT_CLAIMS_WINDOW_MS, 5 * 60 * 1000),
  },
  admin: {
    max: positiveIntEnv(process.env.RATE_LIMIT_ADMIN_MAX, 30),
    windowMs: positiveIntEnv(process.env.RATE_LIMIT_ADMIN_WINDOW_MS, 60 * 1000),
  },
  export: {
    max: positiveIntEnv(process.env.RATE_LIMIT_EXPORT_MAX, 5),
    windowMs: positiveIntEnv(process.env.RATE_LIMIT_EXPORT_WINDOW_MS, 60 * 1000),
  },
};
