import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiUser } from "@/lib/auth/authorization";
import { buildClaimsCsv } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    await requireApiUser({ admin: true });
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
