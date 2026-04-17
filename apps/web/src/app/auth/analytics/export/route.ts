import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exportBusinessAnalyticsReport } from "@platform/analytics";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const url = new URL(request.url);

  try {
    const report = await exportBusinessAnalyticsReport(account.id, {
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      days: url.searchParams.get("days") ? Number(url.searchParams.get("days")) : undefined
    });

    return new NextResponse(report.csv, {
      headers: {
        "content-type": report.contentType,
        "content-disposition": `attachment; filename=\"${report.filename}\"`
      }
    });
  } catch {
    return NextResponse.redirect(new URL("/dashboard/analytics?error=export", request.url));
  }
}
