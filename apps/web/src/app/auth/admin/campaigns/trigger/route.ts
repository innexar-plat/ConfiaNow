import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { triggerCampaign } from "@platform/notifications";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "admin") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const campaignCode = String(formData.get("campaignCode") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const targetRole = String(formData.get("targetRole") ?? "").trim() || undefined;

  try {
    await triggerCampaign({
      adminUserId: account.id,
      campaignCode,
      title,
      body,
      targetRole
    });

    return NextResponse.redirect(new URL("/admin/settings?campaignTriggered=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/settings?error=campaign", request.url));
  }
}
