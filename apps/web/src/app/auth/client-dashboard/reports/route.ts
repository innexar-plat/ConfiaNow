import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { createModerationCase } from "@platform/moderation";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "client") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();

  try {
    await createModerationCase({
      reporterUserId: account.id,
      type: String(formData.get("type") ?? "REPORT_BUSINESS"),
      targetType: String(formData.get("targetType") ?? "business_profile"),
      targetId: String(formData.get("targetId") ?? ""),
      description: String(formData.get("description") ?? "")
    });

    return NextResponse.redirect(new URL("/dashboard?reportCreated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard?error=report", request.url));
  }
}
