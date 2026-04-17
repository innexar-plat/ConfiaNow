import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { cancelCurrentSubscription } from "@platform/billing";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  try {
    await cancelCurrentSubscription(account.id);
    return NextResponse.redirect(new URL("/dashboard/billing?subscriptionCanceled=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/billing?error=subscription-cancel", request.url));
  }
}
