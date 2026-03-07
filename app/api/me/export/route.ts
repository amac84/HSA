import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiUser } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit";
import { buildUserClaimsCsv } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);
    const planYear = Number(searchParams.get("planYear") ?? new Date().getFullYear());
    const csv = await buildUserClaimsCsv(user.id, planYear);

    await logAuditEvent({
      entityType: "EXPORT",
      entityId: `my-claims-${planYear}`,
      action: "USER_CLAIMS_CSV_DOWNLOAD",
      performedByUserId: user.id,
      metadata: {
        planYear,
      },
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="my-claims-${planYear}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json({ error: "Unable to generate export." }, { status: 500 });
  }
}
