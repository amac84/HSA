import { NextResponse } from "next/server";

import { requireApiUser, ApiAuthorizationError } from "@/lib/auth/authorization";
import { createClaimForUser } from "@/lib/claims";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_CLAIM_DOCUMENTS,
  MAX_DOCUMENT_SIZE_BYTES,
  RATE_LIMITS,
} from "@/lib/config";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { claimFormSchema } from "@/lib/validation/claim";

function getExtension(fileName: string) {
  const segments = fileName.toLowerCase().split(".");
  return segments.length > 1 ? segments.at(-1) ?? "" : "";
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();

    const rateLimit = await enforceRateLimit({
      key: `claims:${user.id}`,
      limit: RATE_LIMITS.claims.max,
      windowMs: RATE_LIMITS.claims.windowMs,
    });
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit);
    }

    const formData = await request.formData();

    const files = formData
      .getAll("documents")
      .filter((value): value is File => value instanceof File)
      .filter((file) => file.size > 0);

    if (files.length === 0) {
      return NextResponse.redirect(new URL("/claims/new?error=At least one receipt is required.", request.url));
    }

    if (files.length > MAX_CLAIM_DOCUMENTS) {
      return NextResponse.redirect(
        new URL(`/claims/new?error=Maximum ${MAX_CLAIM_DOCUMENTS} documents allowed.`, request.url),
      );
    }

    const invalidFile = files.find((file) => {
      const extension = getExtension(file.name);
      const supportedMimeType = file.type ? ALLOWED_DOCUMENT_MIME_TYPES.has(file.type.toLowerCase()) : false;
      const supportedExtension = ALLOWED_DOCUMENT_EXTENSIONS.has(extension);

      return !supportedMimeType && !supportedExtension;
    });

    if (invalidFile) {
      return NextResponse.redirect(
        new URL(`/claims/new?error=Unsupported file type for ${invalidFile.name}.`, request.url),
      );
    }

    const oversizedFile = files.find((file) => file.size > MAX_DOCUMENT_SIZE_BYTES);
    if (oversizedFile) {
      return NextResponse.redirect(
        new URL(
          `/claims/new?error=File ${oversizedFile.name} exceeds 10MB limit.`,
          request.url,
        ),
      );
    }

    const parsed = claimFormSchema.safeParse({
      expenseDate: formData.get("expenseDate"),
      providerName: formData.get("providerName"),
      category: formData.get("category"),
      description: formData.get("description"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });

    if (!parsed.success) {
      return NextResponse.redirect(new URL(`/claims/new?error=${parsed.error.issues[0]?.message}`, request.url));
    }

    const created = await createClaimForUser(user, {
      ...parsed.data,
      expenseDate: new Date(parsed.data.expenseDate),
      files,
    });

    if (created.duplicate) {
      return NextResponse.redirect(new URL(`/claims/${created.claim.id}?error=Duplicate submission blocked`, request.url));
    }

    return NextResponse.redirect(new URL(`/claims/${created.claim.id}`, request.url));
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.redirect(new URL("/claims/new?error=Unable to submit claim", request.url));
  }
}
