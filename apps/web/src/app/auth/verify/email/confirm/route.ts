import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  confirmOtpCode,
  getAuthenticatedAccountFromAccessToken
} from "@platform/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();

  try {
    await confirmOtpCode({
      userId: account.id,
      channel: "email",
      code: String(formData.get("code") ?? "")
    });
    return NextResponse.redirect(new URL("/verification?emailVerified=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/verification?error=email-code", request.url));
  }
}
