import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { createBoostCheckout } from "@platform/billing";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const durationDays = Number(formData.get("durationDays") ?? 7);

  try {
    const result = await createBoostCheckout({ userId: account.id, durationDays });
    return NextResponse.redirect(new URL(`/dashboard/billing?boostCreated=1&checkout=${encodeURIComponent(result.data.checkout.reference)}`, request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/billing?error=boost", request.url));
  }
}
