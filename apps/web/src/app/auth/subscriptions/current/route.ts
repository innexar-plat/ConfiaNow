import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { updateCurrentSubscription } from "@platform/billing";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const planCode = String(formData.get("planCode") ?? "");

  try {
    const result = await updateCurrentSubscription({ userId: account.id, planCode });
    return NextResponse.redirect(new URL(`/dashboard/billing?subscriptionUpdated=1&checkout=${encodeURIComponent(result.data.checkout.reference)}`, request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/billing?error=subscription-update", request.url));
  }
}
