import { NextResponse } from "next/server";

import { requireApiUser, ApiAuthorizationError } from "@/lib/auth/authorization";
import { createClaimForUser } from "@/lib/claims";
import { MAX_CLAIM_DOCUMENTS } from "@/lib/config";
import { claimFormSchema } from "@/lib/validation/claim";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
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
