import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { recalculateBusinessTrustScore, restoreBusinessBadge, suspendBusinessBadge } from "@platform/trust";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "admin") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const actionType = String(formData.get("actionType") ?? "recalculate");
  const businessProfileId = String(formData.get("businessProfileId") ?? "");
  const reason = String(formData.get("reason") ?? "") || undefined;

  try {
    if (actionType === "suspend") {
      await suspendBusinessBadge(businessProfileId, account.id, reason ?? "Badge suspended by admin");
    } else if (actionType === "restore") {
      await restoreBusinessBadge(businessProfileId, account.id, reason);
    } else {
      await recalculateBusinessTrustScore(businessProfileId, account.id, reason ?? "Trust score recalculated by admin");
    }

    return NextResponse.redirect(new URL("/admin/settings?trustUpdated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/settings?error=trust", request.url));
  }
}