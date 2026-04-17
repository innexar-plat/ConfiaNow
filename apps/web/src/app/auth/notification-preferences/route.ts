import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { updateNotificationPreferences } from "@platform/notifications";

function toBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();

  try {
    await updateNotificationPreferences({
      userId: account.id,
      inAppEnabled: toBoolean(formData, "inAppEnabled"),
      emailEnabled: toBoolean(formData, "emailEnabled"),
      pushEnabled: toBoolean(formData, "pushEnabled"),
      leadAlertsEnabled: toBoolean(formData, "leadAlertsEnabled"),
      reviewAlertsEnabled: toBoolean(formData, "reviewAlertsEnabled"),
      marketingEnabled: toBoolean(formData, "marketingEnabled")
    });

    return NextResponse.redirect(new URL("/dashboard/notifications?preferencesUpdated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/notifications?error=preferences", request.url));
  }
}
