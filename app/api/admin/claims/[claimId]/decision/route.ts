import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiUser } from "@/lib/auth/authorization";
import { reviewClaim } from "@/lib/claims";
import { claimDecisionSchema } from "@/lib/validation/claim";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ claimId: string }>;
  },
) {
  try {
    const admin = await requireApiUser({ admin: true });
    const { claimId } = await context.params;
    const formData = await request.formData();

    const parsed = claimDecisionSchema.safeParse({
      action: formData.get("action"),
      denialReason: formData.get("denialReason"),
      adminNotes: formData.get("adminNotes"),
    });

    if (!parsed.success) {
      return NextResponse.redirect(
        new URL(`/admin/claims/${claimId}?error=${parsed.error.issues[0]?.message}`, request.url),
      );
    }

    const result = await reviewClaim(claimId, admin, parsed.data);

    if (result.status === "missing_denial_reason") {
      return NextResponse.redirect(new URL(`/admin/claims/${claimId}?error=Denial reason is required.`, request.url));
    }

    if (result.status === "already_decided") {
      return NextResponse.redirect(new URL(`/admin/claims/${claimId}?error=Claim was already decided.`, request.url));
    }

    if (result.status === "not_found") {
      return NextResponse.redirect(new URL("/admin/claims?error=Claim not found", request.url));
    }

    return NextResponse.redirect(new URL(`/admin/claims/${claimId}?message=Claim updated`, request.url));
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.redirect(new URL("/admin/claims?error=Unable to update claim", request.url));
  }
}
