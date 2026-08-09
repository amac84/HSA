import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiUser } from "@/lib/auth/authorization";
import { RATE_LIMITS } from "@/lib/config";
import { buildClaimsCsv } from "@/lib/csv";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const admin = await requireApiUser({ admin: true });

    const rateLimit = await enforceRateLimit({
      key: `export:${admin.id}`,
      limit: RATE_LIMITS.export.max,
      windowMs: RATE_LIMITS.export.windowMs,
    });
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit);
    }

    const { searchParams } = new URL(request.url);
    const planYear = Number(searchParams.get("planYear") ?? new Date().getFullYear());
    const csv = await buildClaimsCsv(planYear);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"claims-${planYear}.csv\"`,
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
