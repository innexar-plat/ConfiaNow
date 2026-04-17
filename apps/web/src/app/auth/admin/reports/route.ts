import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { resolveModerationCase } from "@platform/moderation";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "admin") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const caseId = String(formData.get("caseId") ?? "");
  const decision = String(formData.get("decision") ?? "resolved") as "resolved" | "dismissed";
  const note = String(formData.get("note") ?? "") || undefined;

  try {
    await resolveModerationCase({
      caseId,
      adminUserId: account.id,
      decision,
      note
    });

    return NextResponse.redirect(new URL("/admin/settings?reportUpdated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/settings?error=report", request.url));
  }
}
